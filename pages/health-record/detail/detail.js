Page({
  data: {
    recordId: '',
    loading: true,
    record: null,
    bmi: 0,
    bmiLevel: '',
    bmiColor: '',
    bmiProgress: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recordId: options.id });
      this.loadDetail();
    } else {
      this.setData({ loading: false });
      wx.showToast({ title: '缺少档案ID', icon: 'none' });
    }
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const result = await db.collection('health_records').doc(this.data.recordId).get();

      if (result.data) {
        this.setData({ record: result.data, loading: false });
        this.calcBMI(result.data.shengao, result.data.tizhong);
      } else {
        throw new Error('档案不存在');
      }
    } catch (err) {
      console.error('加载档案详情失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  calcBMI(height, weight) {
    if (!height || !weight) {
      this.setData({ bmi: 0, bmiLevel: '数据不足', bmiColor: '#c8c9cc', bmiProgress: 0 });
      return;
    }

    var h = parseFloat(height) / 100;
    var w = parseFloat(weight);
    if (h <= 0) {
      this.setData({ bmi: 0, bmiLevel: '数据异常', bmiColor: '#ee0a24', bmiProgress: 0 });
      return;
    }

    var bmi = w / (h * h);
    var level = '';
    var color = '';
    var progress = 0;

    if (bmi < 18.5) {
      level = '偏瘦';
      color = '#ff976a';
      progress = Math.min((bmi / 18.5) * 50, 50);
    } else if (bmi < 24) {
      level = '正常';
      color = '#07c160';
      progress = 50 + ((bmi - 18.5) / 5.5) * 30;
    } else if (bmi < 28) {
      level = '偏胖';
      color = '#ff976a';
      progress = 80 + ((bmi - 24) / 4) * 10;
    } else {
      level = '肥胖';
      color = '#ee0a24';
      progress = 90 + Math.min(((bmi - 28) / 4) * 10, 10);
    }

    this.setData({
      bmi: bmi.toFixed(1),
      bmiLevel: level,
      bmiColor: color,
      bmiProgress: Math.min(progress, 100)
    });
  },

  onEdit() {
    wx.navigateTo({
      url: '/pages/health-record/edit/edit?mode=update&id=' + this.data.recordId
    });
  },

  onBack() {
    wx.navigateBack();
  }
});