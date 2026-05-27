Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    healthScore: 0,
    dataStats: {
      recordCount: 0,
      examCount: 0,
      newsFavCount: 0
    }
  },

  onShow() {
    this.refreshUserState();
    if (this.data.isLoggedIn) {
      this.loadUserStats();
    }
  },

  refreshUserState() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  async loadUserStats() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) return;

      const db = wx.cloud.database();

      const countResult = await db.collection('health_records')
        .where({ userId: userInfo._id })
        .count();

      const favResult = await wx.cloud.callFunction({
        name: 'newsFavorite',
        data: { userId: userInfo._id, action: 'count' }
      });

      this.setData({
        dataStats: {
          recordCount: countResult.total || 0,
          examCount: 0,
          newsFavCount: favResult.result?.data?.count || 0
        }
      });
    } catch (err) {
      console.error('加载用户统计失败:', err);
    }
  },

  onNavFavorites() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/health-news/favorites/favorites' });
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onEditProfile() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/profile/edit-profile/edit-profile' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？退出后需要重新登录。',
      confirmText: '确定退出',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('rememberedAccount');
          getApp().globalData.userInfo = null;
          getApp().globalData.isLoggedIn = false;
          this.setData({
            userInfo: null,
            isLoggedIn: false,
            healthScore: 0,
            dataStats: { recordCount: 0, examCount: 0, newsFavCount: 0 }
          });
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  onNavTo(e) {
    var url = e.currentTarget.dataset.url;
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: url });
  },

  onNavHealthRecord() {
    wx.navigateTo({ url: '/pages/health-record/index' });
  },

  onNavVaccine() {
    wx.navigateTo({ url: '/pages/vaccine-reminder/index' });
  },

  onNavSleep() {
    wx.navigateTo({ url: '/pages/sleep-record/index' });
  },

  onNavMedication() {
    wx.navigateTo({ url: '/pages/medication-reminder/index' });
  },

  onNavExam() {
    wx.navigateTo({ url: '/pages/physical-exam/index' });
  },

  onNavNews() {
    wx.switchTab({ url: '/pages/health-news/index' });
  },

  onNavSettings() {
    wx.navigateTo({ url: '/pages/profile/settings' });
  },

  onNavAbout() {
    wx.navigateTo({ url: '/pages/profile/about' });
  },

  onNavFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有建议或问题，请联系客服',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？不会影响您的健康数据。',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          getApp().globalData.userInfo = null;
          getApp().globalData.isLoggedIn = false;
          this.setData({
            userInfo: null,
            isLoggedIn: false
          });
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      }
    });
  }
});