const { ensureAdmin } = require('../../../utils/security');

Page({
  data: {
    bindings: [],
    doctors: [],
    users: [],
    showPopup: false,
    selectedDoctorId: '',
    selectedUserIds: []
  },

  onLoad() {
    if (!ensureAdmin()) return;
    this.loadBindings();
  },

  onShow() {
    ensureAdmin();
    this.loadBindings();
  },

  async loadBindings() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getDoctorUserBindings'
      });

      if (result.result.code === 0) {
        this.setData({ bindings: result.result.data.list });
      }
    } catch (err) {
      console.error('加载绑定关系失败:', err);
    }
  },

  onViewBinding(e) {
    const doctorId = e.currentTarget.dataset.doctorId;
    wx.navigateTo({
      url: `/pages/admin/binding-detail/binding-detail?doctorId=${doctorId}`
    });
  },

  onUnbind(e) {
    const doctorId = e.currentTarget.dataset.doctorId;

    wx.showModal({
      title: '确认解除',
      content: '确定要解除该医生的所有用户绑定吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'unbindDoctorUsers',
              data: { doctorId }
            });

            if (result.result.code === 0) {
              wx.showToast({ title: '解除成功', icon: 'success' });
              this.loadBindings();
            } else {
              wx.showToast({ title: result.result.message, icon: 'none' });
            }
          } catch (err) {
            console.error('解除绑定失败:', err);
            wx.showToast({ title: '网络异常', icon: 'none' });
          }
        }
      }
    });
  },

  async onAddBinding() {
    await this.loadDoctorsAndUsers();
    this.setData({ showPopup: true });
  },

  async loadDoctorsAndUsers() {
    try {
      const [doctorsResult, usersResult] = await Promise.all([
        wx.cloud.callFunction({ name: 'getDoctors', data: { pageSize: 100 } }),
        wx.cloud.callFunction({ name: 'getUsers', data: { pageSize: 100 } })
      ]);

      this.setData({
        doctors: doctorsResult.result.data?.list || [],
        users: usersResult.result.data?.list || []
      });
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  },

  onClosePopup() {
    this.setData({
      showPopup: false,
      selectedDoctorId: '',
      selectedUserIds: []
    });
  },

  onDoctorChange(e) {
    this.setData({ selectedDoctorId: e.detail });
  },

  onUserChange(e) {
    this.setData({ selectedUserIds: e.detail });
  },

  onSelectDoctor(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedDoctorId: id });
  },

  onSelectUser(e) {
    const id = e.currentTarget.dataset.id;
    const selectedUserIds = [...this.data.selectedUserIds];
    const index = selectedUserIds.indexOf(id);

    if (index > -1) {
      selectedUserIds.splice(index, 1);
    } else {
      selectedUserIds.push(id);
    }

    this.setData({ selectedUserIds });
  },

  async onConfirmBinding() {
    const { selectedDoctorId, selectedUserIds } = this.data;

    if (!selectedDoctorId) {
      wx.showToast({ title: '请选择医生', icon: 'none' });
      return;
    }

    if (!selectedUserIds || selectedUserIds.length === 0) {
      wx.showToast({ title: '请选择用户', icon: 'none' });
      return;
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'bindUsersToDoctor',
        data: {
          doctorId: selectedDoctorId,
          userIds: selectedUserIds
        }
      });

      if (result.result.code === 0) {
        wx.showToast({ title: '绑定成功', icon: 'success' });
        this.onClosePopup();
        this.loadBindings();
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('绑定失败:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  }
});
