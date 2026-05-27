Page({
  data: {
    todayList: [],
    historyList: [],
    loading: true,
    stats: {
      todayTotal: 0,
      todayDone: 0,
      weekAdherence: 0,
      streakDays: 0
    },
    todayChecked: {},
    activeTab: 0
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
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
        const today = new Date().toISOString().split('T')[0];

        var checked = {};
        var done = 0;
        list.forEach(function(item) {
          const todayCheckin = (item.checkins || []).find(function(c) { return c.date === today; });
          if (todayCheckin && todayCheckin.times.length > 0) {
            checked[item._id] = true;
            done++;
          }
        });

        var weekDone = 0;
        for (var i = 0; i < 7; i++) {
          var d = new Date();
          d.setDate(d.getDate() - i);
          var dateStr = d.toISOString().split('T')[0];
          var hasCheckin = list.some(function(item) {
            return (item.checkins || []).some(function(c) { return c.date === dateStr && c.times.length > 0; });
          });
          if (hasCheckin) weekDone++;
        }

        this.setData({
          todayList: list.filter(function(item) { return item.status === 'active'; }),
          todayChecked: checked,
          stats: {
            todayTotal: list.filter(function(item) { return item.status === 'active'; }).length,
            todayDone: done,
            weekAdherence: list.length > 0 ? Math.round((weekDone / 7) * 100) : 0,
            streakDays: 0
          },
          loading: false
        });
      }
    } catch (err) {
      console.error('加载打卡数据失败:', err);
      this.setData({ loading: false });
    }
  },

  onTabChange(e) {
    var index = e.detail.index;
    this.setData({ activeTab: index });
  },

  async onCheckin(e) {
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
      var done = this.data.stats.todayDone;
      if (checked[id]) {
        checked[id] = false;
        done--;
        wx.showToast({ title: '已取消', icon: 'none' });
      } else {
        checked[id] = true;
        done++;
        wx.vibrateShort({ type: 'light' });
        wx.showToast({ title: '已打卡', icon: 'success' });
      }
      var stats = this.data.stats;
      stats.todayDone = done;
      this.setData({ todayChecked: checked, stats: stats });
    } catch (err) {
      console.error('打卡失败:', err);
    }
  },

  getAdherenceColor(rate) {
    if (rate >= 80) return '#07c160';
    if (rate >= 50) return '#ff976a';
    return '#ee0a24';
  },

  getAdherenceText(rate) {
    if (rate >= 80) return '优秀';
    if (rate >= 50) return '良好';
    return '需改善';
  }
});