Page({
  data: {
    reportList: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadReports();
  },

  onShow() {
    this.setData({ page: 1, hasMore: true, reportList: [] });
    this.loadReports();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, reportList: [] });
    this.loadReports().then(function() { wx.stopPullDownRefresh(); });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadReports();
    }
  },

  async loadReports() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      var db = wx.cloud.database();
      var pageSize = this.data.pageSize;
      var skip = (this.data.page - 1) * pageSize;

      var countResult = await db.collection('physical_exam')
        .where({ userId: userInfo._id })
        .count();

      var result = await db.collection('physical_exam')
        .where({ userId: userInfo._id })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      var list = result.data || [];
      this.setData({
        reportList: this.data.page === 1 ? list : this.data.reportList.concat(list),
        hasMore: list.length >= pageSize,
        page: this.data.page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载体检报告失败:', err);
    }
  },

  onViewDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/physical-exam/detail?id=' + id });
  }
});