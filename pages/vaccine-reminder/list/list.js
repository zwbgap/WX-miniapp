Page({
  data: {
    activeTab: 0,
    statusFilter: '',
    recordList: [],
    loading: true,
    pendingCount: 0,
    doneCount: 0,
    overdueCount: 0,
    viewUserId: '',
    isDoctorView: false,

    statusTabs: [
      { title: '全部', value: '' },
      { title: '待接种', value: '待接种' },
      { title: '已接种', value: '已接种' }
    ]
  },

  onLoad: function(options) {
    console.log('[list] onLoad');
    if (options.userId) {
      this.setData({ viewUserId: options.userId, isDoctorView: true });
    }
  },

  onShow: function() {
    console.log('[list] onShow 触发');
    this.loadRecords();
  },

  onPullDownRefresh: function() {
    this.loadRecords().then(function() { wx.stopPullDownRefresh(); });
  },

  onTabChange: function(e) {
    var index = e.detail.index;
    var tabs = this.data.statusTabs;
    var status = tabs[index].value;
    this.setData({
      activeTab: index,
      statusFilter: status,
      recordList: []
    });
    this.loadRecords();
  },

  loadRecords: async function() {
    console.log('[list] loadRecords 开始');
    this.setData({ loading: true });

    try {
      var userId;
      if (this.data.viewUserId) {
        userId = this.data.viewUserId;
      } else {
        var userInfo = wx.getStorageSync('userInfo');
        if (!userInfo || !userInfo._id) {
          console.log('[list] 未登录，停止加载');
          this.setData({ loading: false });
          return;
        }
        userId = userInfo._id;
      }

      console.log('[list] 调用云函数 getVaccines, userId=', userId);
      var result = await wx.cloud.callFunction({
        name: 'getVaccines',
        data: { userId: userId }
      });

      console.log('[list] 云函数返回:', JSON.stringify(result.result));
      if (result.result.code === 0) {
        var list = result.result.data || [];
        console.log('[list] 获取到', list.length, '条记录');

        if (this.data.statusFilter) {
          if (this.data.statusFilter === '已接种') {
            list = list.filter(function(item) { return item.zhuangtai === '已接种'; });
          } else if (this.data.statusFilter === '待接种') {
            list = list.filter(function(item) { return item.zhuangtai !== '已接种'; });
          }
          console.log('[list] 筛选后', list.length, '条');
        }

        this.calcStats(list);

        this.setData({
          recordList: list,
          loading: false
        });
        console.log('[list] setData完成, recordList=', this.data.recordList.length);
      } else {
        console.log('[list] 云函数返回错误:', result.result.message);
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error('[list] 加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败: ' + (err.message || ''), icon: 'none' });
    }
  },

  calcStats: function(list) {
    var pending = 0, done = 0, overdue = 0;
    var now = Date.now();

    list.forEach(function(item) {
      if (item.zhuangtai === '已接种') {
        done++;
      } else if (item.tixingshijian) {
        var date = new Date(item.tixingshijian.replace(/-/g, '/')).getTime();
        if (date < now) {
          overdue++;
        } else {
          pending++;
        }
      } else {
        pending++;
      }
    });

    this.setData({ pendingCount: pending, doneCount: done, overdueCount: overdue });
  },

  onViewDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '记录ID缺失', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/vaccine-reminder/detail/detail?mode=update&id=' + id });
  },

  onAdd: function() {
    wx.navigateTo({ url: '/pages/vaccine-reminder/detail/detail?mode=create' });
  },

  onCalendar: function() {
    wx.navigateTo({ url: '/pages/vaccine-reminder/calendar/calendar' });
  },

  onDebug: function() {
    wx.navigateTo({ url: '/pages/vaccine-reminder/debug/debug' });
  },

  onMarkDone: async function(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认接种',
      content: '标记为"已接种"后不可恢复，确定吗？',
      success: async function(res) {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'completeVaccine',
              data: {
                vaccineId: id,
                completedDate: that.formatDate(new Date())
              }
            });
            wx.showToast({ title: '已标记接种', icon: 'success' });
            that.loadRecords();
          } catch (err) {
            console.error('更新失败:', err);
          }
        }
      }
    });
  },

  onDelete: function(e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    console.log('[list] 删除疫苗提醒:', id);
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条疫苗提醒吗？',
      success: async function(res) {
        if (res.confirm) {
          try {
            var db = wx.cloud.database();
            await db.collection('vaccines').doc(id).remove();
            wx.showToast({ title: '删除成功', icon: 'success' });
            that.loadRecords();
          } catch (err) {
            console.error('[list] 删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  formatDate: function(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
});
