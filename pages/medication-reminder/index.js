Page({
  data: {
    reminderList: [],
    loading: false
  },

  onLoad() {
    this.loadReminders();
  },

  onPullDownRefresh() {
    this.loadReminders().then(() => wx.stopPullDownRefresh());
  },

  async loadReminders() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'getMedications',
        data: { userId: userInfo._id }
      });

      if (result.result.code === 0) {
        const list = result.result.data || [];
        this.setData({
          reminderList: list,
          loading: false
        });
      }
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载用药提醒失败:', err);
    }
  },

  onViewDetail(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) { return; }
    wx.navigateTo({ url: '/pages/medication-reminder/setting/setting?mode=update&id=' + id });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/medication-reminder/setting/setting?mode=create' });
  },

  onTestAlert: function() {
    var app = getApp();
    app.globalData.lastMedAlertTime = 0;
    app.clearMedAlertKeys();
    app.checkMedicationAlerts();
  },

  async onToggle(e) {
    const { id, active } = e.currentTarget.dataset;
    try {
      const db = wx.cloud.database();
      await db.collection('medications').doc(id).update({
        data: {
          status: active ? 'paused' : 'active',
          updatedAt: db.serverDate()
        }
      });
      wx.showToast({ title: active ? '已关闭提醒' : '已开启提醒', icon: 'success' });
      this.loadReminders();
    } catch (err) {
      console.error('切换提醒状态失败:', err);
    }
  }
});