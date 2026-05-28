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
        name: 'getMedicationReminders',
        data: {
          keyword: this.data.keyword,
          all: true
        }
      });
      if (result.result.code === 0) {
        this.setData({ records: result.result.data });
      }
    } catch (err) {
      console.error('加载用药记录失败:', err);
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
    wx.showToast({ title: `记录ID: ${id}`, icon: 'none' });
  }
});
