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

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, reportList: [] });
    this.loadReports().then(() => wx.stopPullDownRefresh());
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
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      const db = wx.cloud.database();
      const result = await db.collection('physical_exams')
        .where({ userId: userInfo._id })
        .orderBy('examDate', 'desc')
        .limit(this.data.pageSize)
        .get();

      const list = result.data || [];
      this.setData({
        reportList: this.data.page === 1 ? list : [...this.data.reportList, ...list],
        hasMore: list.length >= this.data.pageSize,
        page: this.data.page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载体检报告失败:', err);
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/physical-exam/detail?id=${id}` });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/physical-exam/edit' });
  }
});