Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    healthScore: 0,
    dashboardLoading: true,
    remindersLoading: true,
    newsLoading: true,

    todayReminders: {
      vaccineList: [],
      medicationList: [],
      vaccineCount: 0,
      medicationCount: 0
    },

    newsList: [],

    sleepTrend: [],
    sleepMaxHours: 8,

    quickEntries: [
      { id: 1, name: '健康档案', icon: 'records', color: '#07c160', url: '/pages/health-record/index' },
      { id: 2, name: '睡眠记录', icon: 'underway-o', color: '#1989fa', url: '/pages/sleep-record/index' },
      { id: 3, name: '疫苗提醒', icon: 'shield-o', color: '#ff976a', url: '/pages/vaccine-reminder/index' },
      { id: 4, name: '用药提醒', icon: 'clock-o', color: '#ee0a24', url: '/pages/medication-reminder/index' },
      { id: 5, name: '体检报告', icon: 'description', color: '#07c160', url: '/pages/physical-exam/index' },
      { id: 6, name: '健康咨询', icon: 'chat-o', color: '#1989fa', url: '/pages/ai-consult/index' },
      { id: 7, name: '数据统计', icon: 'chart-trending-o', color: '#ff976a', url: '/pages/statistics/index/index' },
      { id: 8, name: '更多功能', icon: 'more-o', color: '#ee0a24', url: '/pages/more/index' }
    ],

    swiperCurrent: 0
  },

  onLoad() {
    this.initUserInfo();
    this.loadAllData();
  },

  onShow() {
    var app = getApp();
    if (app.globalData.isLoggedIn !== this.data.isLoggedIn) {
      this.initUserInfo();
      this.loadAllData();
    }
    app.checkMedicationAlerts();
  },

  onPullDownRefresh() {
    this.loadAllData().then(() => wx.stopPullDownRefresh());
  },

  initUserInfo() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    this.setData({
      userInfo: userInfo || null,
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  async loadAllData() {
    if (!this.data.isLoggedIn) {
      this.setData({
        dashboardLoading: false,
        remindersLoading: false,
        sleepTrend: this.getMockSleepTrend()
      });
      await this.loadRecommendNews().catch(function() {});
      return;
    }

    await Promise.allSettled([
      this.loadDashboard().catch(function() {}),
      this.loadTodayReminders().catch(function() {}),
      this.loadRecommendNews().catch(function() {})
    ]);
  },

  async loadDashboard() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        throw new Error('用户未登录');
      }

      const result = await wx.cloud.callFunction({
        name: 'getSleepStatistics',
        data: { userId: userInfo._id, days: 7 }
      });

      if (result.result.code === 0) {
        const data = result.result.data;
        const sleepTrend = data.sleepTrend || [];
        const maxHours = Math.max(...sleepTrend.map(item => item.hours || 0), 8);

        this.setData({
          healthScore: this.calculateHealthScore(data),
          sleepTrend: sleepTrend,
          sleepMaxHours: maxHours,
          dashboardLoading: false
        });
      } else {
        throw new Error(result.result.message);
      }
    } catch (err) {
      console.error('加载首页数据失败:', err);
      this.setData({
        dashboardLoading: false,
        sleepTrend: this.getMockSleepTrend()
      });
    }
  },

  calculateHealthScore(data) {
    const avgDuration = data.avgDuration || 0;
    const totalDays = data.totalDays || 0;
    
    let score = 60;
    if (totalDays >= 5) score += 10;
    if (avgDuration >= 7) score += 20;
    else if (avgDuration >= 6) score += 10;
    if (avgDuration <= 8.5) score += 10;
    
    return Math.min(score, 100);
  },

  getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  },

  isToday(dateStr) {
    if (!dateStr) return false;
    return dateStr.indexOf(this.getTodayStr()) === 0;
  },

  async loadTodayReminders() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        throw new Error('用户未登录');
      }

      const [vaccineResult, medicationResult] = await Promise.all([
        wx.cloud.callFunction({ name: 'getVaccines', data: { userId: userInfo._id } }),
        wx.cloud.callFunction({ name: 'getMedications', data: { userId: userInfo._id } })
      ]);

      var today = this.getTodayStr();

      var vaccineList = [];
      var vaccineCount = 0;
      if (vaccineResult.result.code === 0) {
        var allVaccines = vaccineResult.result.data || [];
        var upcoming = allVaccines.filter(function(item) {
          return item.zhuangtai !== '已接种';
        }).sort(function(a, b) {
          return (a.tixingshijian || '').localeCompare(b.tixingshijian || '');
        });
        vaccineList = upcoming.slice(0, 1).map(function(item) {
          return {
            id: item._id,
            name: item.yimiaomingcheng || item.name || '疫苗提醒',
            date: item.tixingshijian || '',
            location: item.jiezhongdidian || '',
            status: item.zhuangtai || '待接种'
          };
        });
        vaccineCount = upcoming.length;
      }

      var medicationList = [];
      var medicationCount = 0;
      if (medicationResult.result.code === 0) {
        var allMeds = medicationResult.result.data || [];
        medicationList = allMeds.filter(function(item) {
          if (item.status && item.status !== 'active') return false;
          if (!item.startDate) return false;
          var start = item.startDate;
          var end = item.endDate || '9999-12-31';
          return today >= start && today <= end;
        }).map(function(item) {
          var times = (item.times || []).filter(function(t) {
            if (typeof t !== 'string') return false;
            if (t.indexOf('NaN') !== -1) return false;
            return /^\d{2}:\d{2}$/.test(t);
          });
          return {
            id: item._id,
            name: item.name || '用药提醒',
            dosage: item.dosage || '',
            time: times.length > 0 ? times.join('、') : '',
            frequency: item.frequency || ''
          };
        });
        medicationCount = medicationList.length;
      }

      this.setData({
        todayReminders: {
          vaccineList: vaccineList,
          medicationList: medicationList,
          vaccineCount: vaccineCount,
          medicationCount: medicationCount
        },
        remindersLoading: false
      });
    } catch (err) {
      console.error('加载今日提醒失败:', err);
      this.setData({ remindersLoading: false });
    }
  },

  async loadRecommendNews() {
    try {
      var db = wx.cloud.database();
      var result = await db.collection('health_news').limit(10).get();
      var list = result.data || [];
      list.sort(function(a, b) {
        return (b.publishTime || b.date || '').localeCompare(a.publishTime || a.date || '');
      });
      var top3 = list.slice(0, 3);
      this.setData({
        newsList: top3,
        newsLoading: false
      });
    } catch (err) {
      console.error('[首页] 加载推荐资讯失败:', err);
      this.setData({ newsLoading: false });
    }
  },

  getMockSleepTrend() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map(function(day, i) {
      return { date: day, hours: (5.5 + Math.random() * 3).toFixed(1) };
    });
  },

  onQuickEntryTap(e) {
    const url = e.currentTarget.dataset.url;
    if (!this.data.isLoggedIn && url !== '/pages/health-news/index' && url !== '/pages/ai-consult/index') {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: url });
  },

  onReminderTap(e) {
    var type = e.currentTarget.dataset.type;
    var id = e.currentTarget.dataset.id;
    var url = '';
    if (type === 'vaccine') {
      url = '/pages/vaccine-reminder/detail/detail?mode=update&id=' + id;
    } else if (type === 'medication') {
      url = '/pages/medication-reminder/setting/setting?mode=update&id=' + id;
    }
    if (url) {
      wx.navigateTo({ url: url });
    }
  },

  onViewAllReminders(e) {
    const { type } = e.currentTarget.dataset;
    let url = '';
    if (type === 'vaccine') {
      url = '/pages/vaccine-reminder/index';
    } else if (type === 'medication') {
      url = '/pages/medication-reminder/index';
    }
    if (url) {
      wx.navigateTo({ url });
    }
  },

  onNewsTap(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/health-news/detail/detail?id=' + id });
  },

  onMoreNews: function() {
    wx.switchTab({ url: '/pages/health-news/index' });
  },

  onSwiperChange(e) {
    this.setData({ swiperCurrent: e.detail.current });
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  getScoreLevel(score) {
    if (score >= 90) return { label: '优秀', color: '#07c160' };
    if (score >= 75) return { label: '良好', color: '#1989fa' };
    if (score >= 60) return { label: '一般', color: '#ff976a' };
    return { label: '需关注', color: '#ee0a24' };
  },

  formatReminderTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
});