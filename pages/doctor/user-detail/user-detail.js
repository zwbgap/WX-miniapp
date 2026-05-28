const { ensureDoctor } = require('../../../utils/security');

Page({
  data: {
    userInfo: {},
    userId: ''
  },

  onLoad(options) {
    if (!ensureDoctor()) return;
    this.setData({ userId: options.id });
    this.loadUserInfo();
  },

  onShow() {
    ensureDoctor();
  },

  async loadUserInfo() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUserById',
        data: { userId: this.data.userId }
      });
      if (result.result.code === 0) {
        this.setData({ userInfo: result.result.data });
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onNavHealthRecord() {
    wx.navigateTo({ url: `/pages/health-record/index?userId=${this.data.userId}` });
  },

  onNavSleepRecord() {
    wx.navigateTo({ url: `/pages/sleep-record/index?userId=${this.data.userId}` });
  },

  onNavVaccine() {
    wx.navigateTo({ url: `/pages/vaccine-reminder/list/list?userId=${this.data.userId}` });
  },

  onNavMedication() {
    wx.navigateTo({ url: `/pages/medication-reminder/list/list?userId=${this.data.userId}` });
  }
});