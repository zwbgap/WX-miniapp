Page({
  data: {
    recordList: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    this.setData({ page: 1, hasMore: true, recordList: [] });
    this.loadRecords();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, recordList: [] });
    this.loadRecords().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecords();
    }
  },

  async loadRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'getSleepRecords',
        data: {
          userId: userInfo._id,
          page: this.data.page,
          limit: this.data.pageSize
        }
      });

      if (result.result.code === 0) {
        const data = result.result.data;
        const list = data.records || [];
        this.setData({
          recordList: this.data.page === 1 ? list : [...this.data.recordList, ...list],
          hasMore: list.length >= this.data.pageSize,
          page: this.data.page + 1,
          loading: false
        });
      }
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载睡眠记录失败:', err);
    }
  },

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/sleep-record/detail/detail?mode=update&id=${id}` });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/sleep-record/detail/detail?mode=create' });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条睡眠记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database();
            await db.collection('sleep_records').doc(id).remove();
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.setData({ page: 1, hasMore: true, recordList: [] });
            this.loadRecords();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
            console.error('删除睡眠记录失败:', err);
          }
        }
      }
    });
  }
});