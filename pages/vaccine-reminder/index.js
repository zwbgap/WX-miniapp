Page({
  data: {
    reminderList: [],
    loading: true
  },

  onLoad: function() {
    console.log('[index] onLoad');
  },

  onShow: function() {
    console.log('[index] onShow 触发');
    this.loadReminders();
  },

  onPullDownRefresh: function() {
    var that = this;
    this.loadReminders().then(function() { wx.stopPullDownRefresh(); });
  },

  loadReminders: async function() {
    console.log('[index] loadReminders 开始');
    this.setData({ loading: true });

    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        console.log('[index] 未登录');
        this.setData({ loading: false });
        return;
      }

      console.log('[index] 调用云函数 getVaccines, userId=' + userInfo._id);
      var result = await wx.cloud.callFunction({
        name: 'getVaccines',
        data: { userId: userInfo._id }
      });

      console.log('[index] 云函数返回 code=' + result.result.code);
      if (result.result.code === 0) {
        var list = result.result.data || [];
        console.log('[index] 获取到 ' + list.length + ' 条记录');
        list.forEach(function(item, i) {
          console.log('[index] 记录[' + i + '] jiezhongshijian="' + item.jiezhongshijian + '" zhuangtai="' + item.zhuangtai + '"');
        });
        this.setData({
          reminderList: list,
          loading: false
        });
        console.log('[index] setData完成, reminderList=' + this.data.reminderList.length);
      } else {
        console.log('[index] 云函数返回错误');
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error('[index] 加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onViewDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    console.log('[index] onViewDetail, id=' + id);
    if (!id) {
      wx.showToast({ title: '记录ID缺失', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/vaccine-reminder/detail/detail?mode=update&id=' + id });
  },

  onAdd: function() {
    wx.navigateTo({ url: '/pages/vaccine-reminder/detail/detail?mode=create' });
  },

  onDebug: function() {
    wx.navigateTo({ url: '/pages/vaccine-reminder/debug/debug' });
  },

  onDelete: function(e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name || '这条';
    var that = this;
    wx.showModal({
      title: '删除提醒',
      content: '确定要删除「' + name + '」吗？',
      success: function(res) {
        if (res.confirm) {
          var db = wx.cloud.database();
          db.collection('vaccines').doc(id).remove().then(function() {
            wx.showToast({ title: '已删除', icon: 'success' });
            that.loadReminders();
          }).catch(function(err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  }
});
