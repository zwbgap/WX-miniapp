Page({
  data: {
    loading: true,
    healthScore: 0,
    overviewStats: {
      recordCount: 0,
      avgSleep: '--'
    },
    latestRecord: null,
    bmi: 0,
    bmiLevel: '',
    bmiColor: '',
    lifestyleData: {
      xiyan: '无',
      yinjiul: '无',
      yundong: '每周几次',
      yinshi: '规律'
    },
    healthAlerts: [],
    sleepTrend: [],
    sleepAvgDuration: 0,
    sleepTotalDays: 0,
    sleepMaxHours: 10,
    hasSleepData: false
  },

  onLoad() {
    this.loadAllData();
  },

  onPullDownRefresh() {
    this.loadAllData().then(() => wx.stopPullDownRefresh());
  },

  async loadAllData() {
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      const userId = userInfo._id;

      const [healthResult, sleepResult] = await Promise.all([
        wx.cloud.callFunction({
          name: 'getHealthRecords',
          data: { userId, page: 1, limit: 10 }
        }).catch(() => null),
        wx.cloud.callFunction({
          name: 'getSleepStatistics',
          data: { userId, days: 7 }
        }).catch(() => null)
      ]);

      var healthScore = 75;
      var latestRecord = null;
      var bmi = 0;
      var bmiLevel = '';
      var bmiColor = '';
      var recordCount = 0;

      if (healthResult && healthResult.result && healthResult.result.code === 0) {
        var records = healthResult.result.data.records || [];
        recordCount = healthResult.result.data.total || 0;

        if (records.length > 0) {
          latestRecord = records[0];

          var h = parseFloat(latestRecord.shengao);
          var w = parseFloat(latestRecord.tizhong);

          if (h && w && h > 0 && w > 0) {
            h = h / 100;
            bmi = w / (h * h);

            if (bmi < 18.5) { bmiLevel = '偏瘦'; bmiColor = '#ff976a'; healthScore += 5; }
            else if (bmi < 24) { bmiLevel = '正常'; bmiColor = '#07c160'; healthScore += 15; }
            else if (bmi < 28) { bmiLevel = '偏胖'; bmiColor = '#ff976a'; healthScore += 10; }
            else { bmiLevel = '肥胖'; bmiColor = '#ee0a24'; healthScore += 5; }
            bmi = bmi.toFixed(1);
          }

          var lifestyleScore = 0;
          var lifestyleCount = 4;
          if (latestRecord.xiyan === '无') lifestyleScore += 25;
          if (latestRecord.yinjiul === '无') lifestyleScore += 25;
          if (latestRecord.yundong !== '从不') lifestyleScore += 25;
          if (latestRecord.yinshi === '规律') lifestyleScore += 25;
          healthScore = Math.round((healthScore * 0.7 + (lifestyleScore / lifestyleCount) * 0.3));
        }
      }

      var sleepTrend = [];
      var sleepAvgDuration = 0;
      var sleepTotalDays = 0;
      var sleepMaxHours = 10;
      var hasSleepData = false;

      if (sleepResult && sleepResult.result && sleepResult.result.code === 0) {
        var sleepData = sleepResult.result.data;
        sleepAvgDuration = sleepData.avgDuration || 0;
        sleepTotalDays = sleepData.totalDays || 0;
        sleepTrend = sleepData.sleepTrend || [];
        hasSleepData = sleepTrend.length > 0 && sleepTrend.some(function(item) { return item.hours > 0; });

        if (sleepTrend.length > 0) {
          var maxH = Math.max.apply(null, sleepTrend.map(function(item) { return item.hours; }));
          sleepMaxHours = Math.max(Math.ceil(maxH + 2), 8);
        }
      }

      var healthAlerts = [];
      if (latestRecord) {
        if (latestRecord.guominshi && latestRecord.guominshi !== '无' && latestRecord.guominshi.trim() !== '') {
          healthAlerts.push({ type: 'warning', icon: 'warning-o', text: '过敏史：' + latestRecord.guominshi });
        }
        if (latestRecord.yongyao_leixing && latestRecord.yongyao_leixing.trim() !== '') {
          healthAlerts.push({ type: 'primary', icon: 'medicine-box-o', text: '正在服用：' + latestRecord.yongyao_leixing });
        }
        if (latestRecord.yongyao_guomin && latestRecord.yongyao_guomin !== '无' && latestRecord.yongyao_guomin.trim() !== '') {
          healthAlerts.push({ type: 'danger', icon: 'close', text: '药物过敏：' + latestRecord.yongyao_guomin });
        }
        if (latestRecord.jibingshi && latestRecord.jibingshi !== '无' && latestRecord.jibingshi.trim() !== '') {
          healthAlerts.push({ type: 'warning', icon: 'notes-o', text: '疾病史：' + latestRecord.jibingshi });
        }
      }

      this.setData({
        healthScore: Math.min(healthScore, 100),
        overviewStats: {
          recordCount: recordCount,
          avgSleep: sleepAvgDuration ? sleepAvgDuration.toFixed(1) + 'h' : '--'
        },
        latestRecord: latestRecord,
        bmi: bmi,
        bmiLevel: bmiLevel,
        bmiLevelClass: bmiLevel === '偏瘦' ? 'thin' : (bmiLevel === '正常' ? 'normal' : (bmiLevel === '偏胖' ? 'overweight' : (bmiLevel === '肥胖' ? 'obese' : ''))),
        bmiColor: bmiColor,
        lifestyleData: latestRecord ? {
          xiyan: latestRecord.xiyan || '无',
          yinjiul: latestRecord.yinjiul || '无',
          yundong: latestRecord.yundong || '每周几次',
          yinshi: latestRecord.yinshi || '规律'
        } : { xiyan: '无', yinjiul: '无', yundong: '每周几次', yinshi: '规律' },
        healthAlerts: healthAlerts,
        sleepTrend: sleepTrend,
        sleepAvgDuration: sleepAvgDuration,
        sleepTotalDays: sleepTotalDays,
        sleepMaxHours: sleepMaxHours,
        hasSleepData: hasSleepData,
        loading: false
      });
    } catch (err) {
      console.error('加载统计数据失败:', err);
      this.setData({
        healthScore: 78,
        overviewStats: { recordCount: 0, avgSleep: '--' },
        latestRecord: null,
        bmi: 0, bmiLevel: '', bmiColor: '',
        lifestyleData: { xiyan: '无', yinjiul: '无', yundong: '每周几次', yinshi: '规律' },
        healthAlerts: [],
        sleepTrend: [], sleepAvgDuration: 0, sleepTotalDays: 0, sleepMaxHours: 10, hasSleepData: false,
        loading: false
      });
    }
  },

  onNavHealthRecord() {
    wx.navigateTo({ url: '/pages/health-record/index/index' });
  },

  getScoreLevel(score) {
    if (score >= 90) return { text: '优秀', color: '#07c160' };
    if (score >= 75) return { text: '良好', color: '#1989fa' };
    if (score >= 60) return { text: '一般', color: '#ff976a' };
    return { text: '需改善', color: '#ee0a24' };
  }
});