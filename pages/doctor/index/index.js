const { ensureDoctor } = require('../../../utils/security');

Page({
  data: {
    userInfo: {},
    stats: {
      userCount: 0,
      examCount: 0
    }
  },

  onLoad() {
    if (!ensureDoctor()) return;
    this.loadUserInfo();
  },

  onShow() {
    if (!ensureDoctor()) return;
    this.loadUserInfo();
    this.loadStats();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const app = getApp();
    if (userInfo) {
      app.globalData.userInfo = userInfo;
      app.globalData.isLoggedIn = true;
      app.globalData.identity = 'doctor';
      this.setData({ userInfo });
    }
  },

  async loadStats() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const doctorId = userInfo._id;
      const db = wx.cloud.database();

      const [userResult, examResult] = await Promise.all([
        db.collection('user_profiles')
          .where({ doctorId: doctorId })
          .count()
          .catch(function() { return { total: 0 }; }),
        db.collection('physical_exam')
          .where({ doctorId: doctorId })
          .count()
          .catch(function() { return { total: 0 }; })
      ]);

      this.setData({
        stats: {
          userCount: userResult.total || 0,
          examCount: examResult.total || 0
        }
      });
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  onNavUsers() {
    wx.navigateTo({ url: '/pages/doctor/users/users' });
  },

  onNavPhysicalExam() {
    wx.navigateTo({ url: '/pages/doctor/physical-exam/physical-exam' });
  },

  onNavProfile() {
    wx.navigateTo({ url: '/pages/doctor/profile/profile' });
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