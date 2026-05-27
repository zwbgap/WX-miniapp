Page({
  data: {
    recordList: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    dateFilter: '',
    datePickerVisible: false,
    currentDate: Date.now(),
    deletingId: ''
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
        let records = data.records || [];
        
        if (this.data.dateFilter) {
          records = records.filter(r => r.rushuishijian && r.rushuishijian.startsWith(this.data.dateFilter));
        }

        this.setData({
          recordList: this.data.page === 1 ? records : [...this.data.recordList, ...records],
          hasMore: data.records.length >= this.data.pageSize,
          page: this.data.page + 1,
          loading: false
        });
      } else {
        throw new Error(result.result.message);
      }
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载睡眠记录失败:', err);
    }
  },

  onShowDatePicker() {
    this.setData({ datePickerVisible: true });
  },

  onDateConfirm(e) {
    const ts = e.detail;
    const d = new Date(ts);
    const dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    this.setData({
      dateFilter: dateStr,
      datePickerVisible: false,
      page: 1,
      hasMore: true,
      recordList: []
    });
    this.loadRecords();
  },

  onDateCancel() {
    this.setData({ datePickerVisible: false });
  },

  onClearDateFilter() {
    this.setData({
      dateFilter: '',
      page: 1,
      hasMore: true,
      recordList: []
    });
    this.loadRecords();
  },

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/sleep-record/detail/detail?mode=update&id=' + id });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/sleep-record/detail/detail?mode=create' });
  },

  onStatistics() {
    wx.navigateTo({ url: '/pages/sleep-record/statistics/statistics' });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这条睡眠记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDelete(id);
        }
      }
    });
  },

  async doDelete(id) {
    try {
      const db = wx.cloud.database();
      await db.collection('sleep_records').doc(id).remove();
      wx.showToast({ title: '已删除', icon: 'success' });
      const recordList = this.data.recordList.filter(item => item._id != id);
      this.setData({ recordList: recordList });
    } catch (err) {
      console.error('删除失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  formatDuration(hours) {
    if (!hours && hours !== 0) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h + '小时' + m + '分钟';
  },

  getQualityTag(quality) {
    if (!quality) return { text: '一般', type: 'warning' };
    if (quality === 'good') return { text: '非常好', type: 'success' };
    if (quality === 'normal') return { text: '一般', type: 'primary' };
    return { text: '较差', type: 'danger' };
  }
});