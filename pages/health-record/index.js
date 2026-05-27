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
        throw new Error('用户未登录');
      }

      const result = await wx.cloud.callFunction({
        name: 'getHealthRecords',
        data: {
          userId: userInfo._id,
          page: this.data.page,
          limit: this.data.pageSize
        }
      });

      if (result.result.code === 0) {
        const data = result.result.data;
        const records = data.records || [];
        this.setData({
          recordList: this.data.page === 1 ? records : [...this.data.recordList, ...records],
          hasMore: records.length >= this.data.pageSize,
          page: this.data.page + 1,
          loading: false
        });
      } else {
        throw new Error(result.result.message);
      }
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载健康档案失败:', err);
    }
  },

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/health-record/detail/detail?id=${id}` });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/health-record/edit/edit' });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条健康档案吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteHealthRecord',
              data: { id }
            });
            if (result.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.setData({ page: 1, hasMore: true, recordList: [] });
              this.loadRecords();
            } else {
              wx.showToast({ title: result.result.message, icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
            console.error('删除健康档案失败:', err);
          }
        }
      }
    });
  }
});