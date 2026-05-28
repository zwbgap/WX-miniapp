const { ensureAdmin } = require('../../../utils/security');

function formatDate(dateObj) {
  if (!dateObj) return '未知时间';

  if (typeof dateObj === 'string') {
    const date = new Date(dateObj);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
    return dateObj;
  }

  if (dateObj.$date) {
    return formatDate(dateObj.$date);
  }

  if (dateObj instanceof Date) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  return String(dateObj);
}

Page({
  data: {
    loading: false,
    user: null,
    userId: '',
    profile: null,
    doctorInfo: null
  },

  onLoad(options) {
    console.log('user-detail onLoad, options:', options);
    if (!ensureAdmin()) return;

    if (options.userId) {
      console.log('获取到userId:', options.userId);
      this.setData({ userId: options.userId });
      this.loadUserInfo();
    } else {
      console.log('没有获取到userId');
    }
  },

  onShow() {
    ensureAdmin();
  },

  async loadUserInfo() {
    if (!this.data.userId) {
      console.log('userId为空，无法加载');
      return;
    }

    this.setData({ loading: true });
    console.log('开始加载用户信息, userId:', this.data.userId);
    try {
      const db = wx.cloud.database();

      // 查询 users 集合获取基本信息
      const userResult = await db.collection('users').doc(this.data.userId).get();
      console.log('users查询结果:', userResult);

      // 查询 user_profiles 集合获取详细信息
      const profileResult = await db.collection('user_profiles')
        .where({ userId: this.data.userId })
        .limit(1)
        .get();
      console.log('user_profiles查询结果:', profileResult);

      let profile = null;
      let doctorInfo = null;

      if (profileResult.data && profileResult.data.length > 0) {
        profile = profileResult.data[0];

        // 如果有绑定的医生，查询医生信息
        if (profile.doctorId) {
          try {
            const doctorResult = await db.collection('users').doc(profile.doctorId).get();
            if (doctorResult.data) {
              doctorInfo = doctorResult.data;
            }
          } catch (err) {
            console.error('查询医生信息失败:', err);
          }
        }
      }

      this.setData({
        user: userResult.data || null,
        profile: profile,
        doctorInfo: doctorInfo
      });
      console.log('设置后的数据:', this.data);
    } catch (err) {
      console.error('加载用户信息失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});