const { ensureDoctor } = require('../../../utils/security');

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

Page({
  data: {
    users: [],
    reports: [],
    form: {
      title: '',
      content: '',
      reportDate: ''
    },
    currentDate: '',
    today: '',
    selectedUserId: '',
    showDatePicker: false,
    loading: false,
    contentLength: 0,
    contentMax: 1000,
    currentTab: 0
  },

  onLoad() {
    if (!ensureDoctor()) return;
    var now = new Date();
    var dateStr = formatDate(now);
    var ts = now.getTime();
    this.setData({
      'form.reportDate': dateStr,
      currentDate: ts,
      today: formatDate(now)
    });
    this.loadBoundUsers();
    this.loadReports();
  },

  onShow() {
    ensureDoctor();
    this.loadReports();
  },

  async loadBoundUsers() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) return;

      var result = await wx.cloud.callFunction({
        name: 'getBoundUsers',
        data: { doctorId: userInfo._id, pageSize: 100 }
      });

      if (result.result.code === 0) {
        this.setData({ users: result.result.data.list });
      }
    } catch (err) {
      console.error('加载绑定用户失败:', err);
    }
  },

  async loadReports() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) return;

      var db = wx.cloud.database();
      var result = await db.collection('physical_exam')
        .where({ doctorId: userInfo._id })
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      this.setData({ reports: result.data || [] });
    } catch (err) {
      console.error('加载体检报告记录失败:', err);
    }
  },

  onTabChange(e) {
    this.setData({ currentTab: e.detail.index });
  },

  onViewReport(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/physical-exam/detail?id=' + id });
  },

  onSelectUser(e) {
    var userId = e.currentTarget.dataset.id;
    var users = this.data.users;
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i]._id === userId) { user = users[i]; break; }
    }
    var userName = user ? (user.profile.xingming || user.nickName || user.account) : '';

    this.setData({
      selectedUserId: userId,
      'form.title': userName + ' 体检报告'
    });
  },

  onTitleInput(e) {
    this.setData({ 'form.title': e.detail });
  },

  onContentInput(e) {
    var val = e.detail.value;
    this.setData({
      'form.content': val,
      contentLength: val.length
    });
  },

  onOpenDatePicker() {
    this.setData({ showDatePicker: true });
  },

  onDateConfirm(e) {
    var val = e.detail;
    if (typeof val === 'number') {
      var d = new Date(val);
      var dateStr = formatDate(d);
      this.setData({ 'form.reportDate': dateStr, currentDate: val, showDatePicker: false });
    } else {
      this.setData({ 'form.reportDate': val, showDatePicker: false });
    }
  },

  onDateCancel() {
    this.setData({ showDatePicker: false });
  },

  async onSubmit() {
    var title = this.data.form.title;
    var content = this.data.form.content;
    var reportDate = this.data.form.reportDate;
    var userId = this.data.selectedUserId;

    if (!userId) {
      wx.showToast({ title: '请选择用户', icon: 'none' });
      return;
    }
    if (!title.trim()) {
      wx.showToast({ title: '请输入报告标题', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请输入报告内容', icon: 'none' });
      return;
    }
    if (!reportDate) {
      wx.showToast({ title: '请选择报告日期', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      var userInfo = wx.getStorageSync('userInfo');

      var result = await wx.cloud.callFunction({
        name: 'addPhysicalExam',
        data: {
          doctorId: userInfo._id,
          userId: userId,
          title: title.trim(),
          content: content.trim(),
          reportDate: reportDate
        }
      });

      if (result.result.code === 0) {
        wx.showToast({ title: '发送成功', icon: 'success' });
        var now = new Date();
        var dateStr = formatDate(now);
        this.setData({
          form: { title: '', content: '', reportDate: dateStr },
          currentDate: now.getTime(),
          selectedUserId: '',
          contentLength: 0
        });
        this.loadReports();
      } else {
        console.log('发送体检报告失败, 返回:', JSON.stringify(result.result));
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('发送报告网络异常:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});