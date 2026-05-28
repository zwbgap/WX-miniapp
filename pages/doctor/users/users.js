const { ensureDoctor } = require('../../../utils/security');

Page({
  data: {
    users: [],
    keyword: '',
    page: 1,
    pageSize: 20,
    total: 0
  },

  onLoad() {
    if (!ensureDoctor()) return;
    this.loadBoundUsers();
  },

  onShow() {
    if (!ensureDoctor()) return;
  },

  async loadBoundUsers() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) return;

      wx.showLoading({ title: '加载中...' });

      const result = await wx.cloud.callFunction({
        name: 'getBoundUsers',
        data: {
          doctorId: userInfo._id,
          keyword: this.data.keyword,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });

      wx.hideLoading();

      if (result.result.code === 0) {
        this.setData({
          users: result.result.data.list,
          total: result.result.data.total
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载绑定用户失败:', err);
    }
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail });
  },

  onSearch() {
    this.setData({ page: 1 });
    this.loadBoundUsers();
  },

  onPageChange(e) {
    this.setData({ page: e.detail });
    this.loadBoundUsers();
  },

  onUserDetail(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/doctor/user-detail/user-detail?id=${userId}` });
  }
});