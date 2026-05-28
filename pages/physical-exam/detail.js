Page({
  data: {
    loading: true,
    report: null
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    this.loadDetail(options.id);
  },

  async loadDetail(id) {
    var db = wx.cloud.database();
    try {
      var result = await db.collection('physical_exam').doc(id).get();
      this.setData({ report: result.data, loading: false });
    } catch (err) {
      console.error('加载报告详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onBack() {
    wx.navigateBack();
  }
});