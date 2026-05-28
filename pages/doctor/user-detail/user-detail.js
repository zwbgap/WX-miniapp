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

  onUnbindUser() {
    wx.showModal({
      title: '解除绑定',
      content: '确定要解除与该用户的绑定关系吗？解除后将无法查看该用户的健康数据。',
      confirmColor: '#ee0a24',
      success: async (res) => {
        if (res.confirm) {
          await this.doUnbind();
        }
      }
    });
  },

  async doUnbind() {
    try {
      wx.showLoading({ title: '操作中...' });
      
      console.log('doUnbind 开始，userId:', this.data.userId);
      
      const result = await wx.cloud.callFunction({
        name: 'unbindUser',
        data: {
          userId: this.data.userId
        }
      });
      
      console.log('unbindUser result:', result);

      if (result.result.code === 0) {
        console.log('解除绑定成功，stats:', result.result.stats);
      } else {
        console.error('解除绑定失败:', result.result.message);
        wx.showToast({ title: result.result.message || '解除绑定失败', icon: 'none' });
        wx.hideLoading();
        return;
      }

      wx.hideLoading();
      wx.showToast({ title: '解除绑定成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('解除绑定失败:', err);
      wx.showToast({ title: '解除绑定失败', icon: 'none' });
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