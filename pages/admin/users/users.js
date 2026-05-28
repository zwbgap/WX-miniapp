const { ensureAdmin } = require('../../../utils/security');

Page({
  data: {
    users: [],
    keyword: ''
  },

  onLoad() {
    if (!ensureAdmin()) return;
    this.loadUsers();
  },

  onShow() {
    ensureAdmin();
  },

  async loadUsers() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getUsers',
        data: { pageSize: 100 }
      });

      if (result.result.code === 0) {
        this.setData({ users: result.result.data?.list || [] });
      }
    } catch (err) {
      console.error('加载用户列表失败:', err);
    }
  },

  onSearch() {
    this.loadUsers();
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail });
  },

  onUserDetail(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/user-detail/user-detail?userId=${userId}`
    });
  },

  onDeleteUser(e) {
    const userId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该用户账号吗？此操作不可恢复！',
      confirmColor: '#dc3545',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteUser',
              data: { userId }
            });

            if (result.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadUsers();
            } else {
              wx.showToast({ title: result.result.message, icon: 'none' });
            }
          } catch (err) {
            console.error('删除用户失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
