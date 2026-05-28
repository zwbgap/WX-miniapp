function cleanTimeArray(times) {
  if (!times || !Array.isArray(times)) return [];
  return times.filter(function(t) {
    if (typeof t !== 'string') return false;
    if (t.indexOf('NaN') !== -1) return false;
    return /^\d{2}:\d{2}$/.test(t);
  });
}

Page({
  data: {
    activeTab: 0,
    allList: [],
    todayList: [],
    loading: false,
    todayChecked: {},
    todayTotal: 0,
    todayDone: 0,

    tabs: [
      { title: '全部', key: 'all' },
      { title: '进行中', key: 'active' },
      { title: '已完成', key: 'done' }
    ],
    viewUserId: '',
    isDoctorView: false
  },

  onLoad(options) {
    if (options.userId) {
      this.setData({ viewUserId: options.userId, isDoctorView: true });
    }
    this.loadReminders();
    this.loadTodayReminders();
  },

  onShow() {
    this.loadTodayReminders();
    getApp().checkMedicationAlerts();
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadReminders(),
      this.loadTodayReminders()
    ]).then(() => wx.stopPullDownRefresh());
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.index });
  },

  async loadReminders() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      var userId;
      if (this.data.viewUserId) {
        userId = this.data.viewUserId;
      } else {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo._id) {
          this.setData({ loading: false });
          return;
        }
        userId = userInfo._id;
      }

      const result = await wx.cloud.callFunction({
        name: 'getMedications',
        data: { userId: userId }
      });

      if (result.result.code === 0) {
        const list = result.result.data || [];
        var cleanedList = list.map(function(item) {
          item.times = cleanTimeArray(item.times);
          return item;
        });
        this.setData({
          allList: cleanedList,
          loading: false
        });
      }
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载用药提醒失败:', err);
    }
  },

  async loadTodayReminders() {
    try {
      var userId;
      if (this.data.viewUserId) {
        userId = this.data.viewUserId;
      } else {
        const userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo._id) return;
        userId = userInfo._id;
      }

      const result = await wx.cloud.callFunction({
        name: 'getMedications',
        data: { userId: userId }
      });

      if (result.result.code === 0) {
        const list = (result.result.data || []).map(function(item) {
          item.times = cleanTimeArray(item.times);
          return item;
        });
        const today = new Date().toISOString().split('T')[0];

        var checked = {};
        var done = 0;
        list.forEach(function(item) {
          const todayCheckin = (item.checkins || []).find(function(c) { return c.date === today; });
          if (todayCheckin) {
            checked[item._id] = true;
            done++;
          }
        });

        this.setData({
          todayList: list.filter(function(item) { return item.status === 'active'; }),
          todayTotal: list.filter(function(item) { return item.status === 'active'; }).length,
          todayDone: done,
          todayChecked: checked
        });
      }
    } catch (err) {
      console.error('加载今日提醒失败:', err);
    }
  },

  async onToggleActive(e) {
    var id = e.currentTarget.dataset.id;
    var active = e.currentTarget.dataset.active;
    try {
      const db = wx.cloud.database();
      await db.collection('medications').doc(id).update({
        data: {
          status: active ? 'paused' : 'active',
          updatedAt: db.serverDate()
        }
      });
      wx.showToast({ title: active ? '已暂停' : '已开启', icon: 'success' });
      this.loadReminders();
    } catch (err) {
      console.error('切换状态失败:', err);
    }
  },

  async onTodayCheckin(e) {
    var id = e.currentTarget.dataset.id;
    try {
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      await wx.cloud.callFunction({
        name: 'checkinMedication',
        data: {
          medicationId: id,
          checkinTime: timeStr
        }
      });

      var checked = this.data.todayChecked;
      var done = this.data.todayDone;
      if (checked[id]) {
        checked[id] = false;
        done--;
        wx.showToast({ title: '已取消标记', icon: 'none' });
      } else {
        checked[id] = true;
        done++;
        wx.showToast({ title: '已打卡', icon: 'success' });
      }
      this.setData({ todayChecked: checked, todayDone: done });
    } catch (err) {
      console.error('打卡失败:', err);
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

  onGoCheckin() {
    wx.navigateTo({ url: '/pages/medication-reminder/checkin/checkin' });
  },

  async onDelete(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '删除提醒',
      content: '确定要删除这条用药提醒吗？',
      success: async function(res) {
        if (res.confirm) {
          try {
            const db = wx.cloud.database();
            await db.collection('medications').doc(id).remove();
            wx.showToast({ title: '已删除', icon: 'success' });
            var list = that.data.allList.filter(function(item) { return item._id != id; });
            that.setData({ allList: list });
          } catch (err) {
            console.error('删除失败:', err);
          }
        }
      }
    });
  },

  filterList: function() {
    var tab = this.data.tabs[this.data.activeTab].key;
    if (tab === 'all') return this.data.allList;
    if (tab === 'active') return this.data.allList.filter(function(item) {
      return item.status === 'active';
    });
    return this.data.allList.filter(function(item) {
      return item.status !== 'active';
    });
  },

  getStatusTag(status) {
    if (status === 'finished' || status === '已完成') return { type: 'success', text: '已完成' };
    if (status === 'paused' || status === '已暂停') return { type: 'default', text: '已暂停' };
    return { type: 'danger', text: '进行中' };
  }
});