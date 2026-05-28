Page({
  data: {
    loading: true,
    viewUserId: '',
    isDoctorView: false,
    recordList: [],

    avgDuration: 0,
    totalDays: 0,
    sleepTrend: [],
    sleepMaxHours: 10
  },

  onLoad(options) {
    if (options.userId) {
      this.setData({ viewUserId: options.userId, isDoctorView: true });
    }
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadStats().then(function() { wx.stopPullDownRefresh(); });
  },

  async loadStats() {
    this.setData({ loading: true });
    try {
      var userId;
      if (this.data.viewUserId) {
        userId = this.data.viewUserId;
      } else {
        var userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo._id) {
          this.setData({ loading: false });
          return;
        }
        userId = userInfo._id;
      }

      var [sleepResult, recordsResult] = await Promise.all([
        wx.cloud.callFunction({
          name: 'getSleepStatistics',
          data: { userId: userId, days: 7 }
        }).catch(function() { return null; }),
        wx.cloud.callFunction({
          name: 'getSleepRecords',
          data: { userId: userId, page: 1, limit: 50 }
        }).catch(function() { return null; })
      ]);

      var avgDuration = 0;
      var totalDays = 0;
      var sleepTrend = [];
      var sleepMaxHours = 10;

      if (sleepResult && sleepResult.result && sleepResult.result.code === 0) {
        var data = sleepResult.result.data;
        avgDuration = data.avgDuration || 0;
        totalDays = data.totalDays || 0;
        sleepTrend = data.sleepTrend || [];

        if (sleepTrend.length > 0) {
          var maxH = Math.max.apply(null, sleepTrend.map(function(item) { return item.hours; }));
          sleepMaxHours = Math.max(Math.ceil(maxH + 2), 8);
        }
      }

      var recordList = [];
      if (recordsResult && recordsResult.result && recordsResult.result.code === 0) {
        recordList = recordsResult.result.data.records || [];
      }

      this.setData({
        avgDuration: avgDuration,
        totalDays: totalDays,
        sleepTrend: sleepTrend,
        sleepMaxHours: sleepMaxHours,
        recordList: recordList,
        loading: false
      });
    } catch (err) {
      console.error('加载睡眠统计失败:', err);
      this.setData({ loading: false });
    }
  },

  onViewDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/sleep-record/detail/detail?mode=update&id=' + id });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/sleep-record/detail/detail?mode=create' });
  },

  onDelete(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条睡眠记录吗？',
      success: function(res) {
        if (res.confirm) {
          var db = wx.cloud.database();
          db.collection('sleep_records').doc(id).remove().then(function() {
            wx.showToast({ title: '删除成功', icon: 'success' });
            that.loadStats();
          }).catch(function(err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  }
});