const { ensureDoctor } = require('../../../utils/security');

Page({
  data: {
    records: [],
    keyword: ''
  },

  onLoad() {
    if (!ensureDoctor()) return;
    this.loadRecords();
  },

  onShow() {
    ensureDoctor();
  },

  async loadRecords() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getHealthRecords',
        data: {
          keyword: this.data.keyword
        }
      });
      if (result.result.code === 0) {
        this.setData({ records: result.result.data });
      }
    } catch (err) {
      console.error('加载健康档案失败:', err);
    }
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail });
  },

  onSearch() {
    this.loadRecords();
  },

  onRecordDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/health-record/detail/detail?id=${id}` });
  }
});
