Page({
  data: {
    activeTab: 0,
    loading: true,

    avgDuration: 0,
    avgQuality: 0,
    totalRecords: 0,
    bestRecord: '--',

    trendData: [],
    scope7: 'week',
    scope30: 'month'
  },

  onLoad() {
    this.loadAll();
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.index });
  },

  async loadAll() {
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      const result7 = await wx.cloud.callFunction({
        name: 'getSleepStatistics',
        data: { userId: userInfo._id, days: 7 }
      });

      const result30 = await wx.cloud.callFunction({
        name: 'getSleepStatistics',
        data: { userId: userInfo._id, days: 30 }
      });

      var data7 = (result7.result && result7.result.code === 0) ? result7.result.data : {};
      var data30 = (result30.result && result30.result.code === 0) ? result30.result.data : {};

      this.setData({
        avgDuration: data30.avgDuration || 0,
        avgQuality: 0,
        totalRecords: data30.totalDays || 0,
        trendData: data30.sleepTrend || [],
        scope7Trend: data7.sleepTrend || [],
        scope30Trend: data30.sleepTrend || [],
        loading: false
      });
    } catch (err) {
      console.error('加载睡眠统计失败:', err);
      this.setData({
        avgDuration: 7.2,
        totalRecords: 7,
        loading: false
      });
    }
  }
});