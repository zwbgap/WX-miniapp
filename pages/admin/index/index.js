const { ensureAdmin } = require('../../../utils/security');

Page({
  data: {
    adminInfo: {}
  },

  onLoad() {
    if (!ensureAdmin()) return;
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ adminInfo: userInfo });
    }
  },

  onShow() {
    if (!ensureAdmin()) return;
  },

  onNavInviteCode() {
    wx.navigateTo({ url: '/pages/admin/invite-code/invite-code' });
  },

  onNavDoctors() {
    wx.navigateTo({ url: '/pages/admin/doctors/doctors' });
  },

  onNavUsers() {
    wx.navigateTo({ url: '/pages/admin/users/users' });
  },

  onNavBindings() {
    wx.navigateTo({ url: '/pages/admin/bindings/bindings' });
  },

  onClearAllData() {
    wx.showModal({
      title: '危险操作',
      content: '确定要清除数据库中的所有数据吗？此操作不可恢复！',
      confirmColor: '#dc3545',
      success: async (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '这是最后一次确认，清除后所有数据将无法恢复！',
            confirmColor: '#dc3545',
            success: async (confirm) => {
              if (confirm.confirm) {
                try {
                  wx.showLoading({ title: '清除中...' });
                  const result = await wx.cloud.callFunction({
                    name: 'clearAllData'
                  });
                  wx.hideLoading();

                  if (result.result.code === 0) {
                    wx.showToast({ title: '清除成功', icon: 'success' });
                  } else {
                    wx.showToast({ title: result.result.message, icon: 'none' });
                  }
                } catch (err) {
                  wx.hideLoading();
                  console.error('清除数据失败:', err);
                  wx.showToast({ title: '清除失败', icon: 'none' });
                }
              }
            }
          });
        }
      }
    });
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          getApp().globalData.userInfo = null;
          getApp().globalData.isLoggedIn = false;
          getApp().globalData.identity = null;
          wx.redirectTo({ url: '/pages/login/login' });
        }
      }
    });
  }
});
