const { ensureAdmin } = require('../../../utils/security');

Page({
  data: {
    doctors: [],
    keyword: ''
  },

  onLoad() {
    if (!ensureAdmin()) return;
    this.loadDoctors();
  },

  onShow() {
    ensureAdmin();
  },

  async loadDoctors() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getDoctors',
        data: { pageSize: 100 }
      });

      if (result.result.code === 0) {
        this.setData({ doctors: result.result.data || [] });
      }
    } catch (err) {
      console.error('加载医生列表失败:', err);
    }
  },

  onSearch() {
    this.loadDoctors();
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail });
  },

  onDoctorDetail(e) {
    const doctorId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/doctor-detail/doctor-detail?doctorId=${doctorId}`
    });
  },

  onDeleteDoctor(e) {
    const doctorId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该医生账号吗？此操作不可恢复！',
      confirmColor: '#dc3545',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteUser',
              data: { userId: doctorId }
            });

            if (result.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadDoctors();
            } else {
              wx.showToast({ title: result.result.message, icon: 'none' });
            }
          } catch (err) {
            console.error('删除医生失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
