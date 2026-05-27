Page({
  data: {
    logs: [],
    userId: ''
  },

  onLoad() {
    var userInfo = wx.getStorageSync('userInfo');
    var uid = (userInfo && userInfo._id) ? userInfo._id : '未登录';
    this.setData({ userId: uid });
    this.addLog('DEBUG页启动, userId=' + uid);
  },

  addLog(msg) {
    var logs = this.data.logs;
    logs.unshift({ time: new Date().toLocaleTimeString(), text: msg, _key: Date.now() + '_' + Math.random() });
    this.setData({ logs: logs });
  },

  // ============ 测试1: 列出所有记录 (直接查询) ============
  testDirectQuery() {
    var that = this;
    that.addLog('--- 测试: 直接查 vaccines 集合 ---');
    var db = wx.cloud.database();
    db.collection('vaccines').limit(20).get().then(function(res) {
      that.addLog('成功! 共 ' + res.data.length + ' 条记录');
      res.data.forEach(function(item, i) {
        that.addLog('[' + i + '] _id=' + item._id +
          ' name=' + (item.yimiaomingcheng || item.name || '无') +
          ' date=' + (item.tixingshijian || item.dueDate || '无') +
          ' status=' + (item.zhuangtai || item.status || '无') +
          ' userId=' + (item.userId || '无'));
      });
    }).catch(function(err) {
      that.addLog('失败: ' + err.message);
    });
  },

  // ============ 测试2: 列出当前用户记录 ============
  testUserQuery() {
    var that = this;
    var uid = this.data.userId;
    that.addLog('--- 测试: 查当前用户=' + uid + ' ---');
    if (!uid || uid === '未登录') {
      that.addLog('错误: 未登录, 请先登录');
      return;
    }
    var db = wx.cloud.database();
    db.collection('vaccines').where({ userId: uid }).limit(20).get().then(function(res) {
      that.addLog('成功! 共 ' + res.data.length + ' 条');
      res.data.forEach(function(item, i) {
        that.addLog('[' + i + '] _id=' + item._id +
          ' | 疫苗名=' + (item.yimiaomingcheng || item.name || '无') +
          ' | 提醒时间=' + (item.tixingshijian || item.dueDate || '无') +
          ' | 状态=' + (item.zhuangtai || item.status || '无'));
      });
    }).catch(function(err) {
      that.addLog('失败: ' + err.message);
    });
  },

  // ============ 测试3: 云函数查询 ============
  testCloudFunction() {
    var that = this;
    var uid = this.data.userId;
    that.addLog('--- 测试: 云函数 getVaccines ---');
    if (!uid || uid === '未登录') {
      that.addLog('错误: 未登录');
      return;
    }
    wx.cloud.callFunction({
      name: 'getVaccines',
      data: { userId: uid }
    }).then(function(res) {
      that.addLog('云函数返回 code=' + res.result.code);
      var list = res.result.data || [];
      that.addLog('记录数=' + list.length);
      list.forEach(function(item, i) {
        that.addLog('[' + i + '] _id=' + item._id +
          ' yimiaomingcheng=' + (item.yimiaomingcheng || '无') +
          ' tixingshijian=' + (item.tixingshijian || '无') +
          ' zhuangtai=' + (item.zhuangtai || '无'));
      });
    }).catch(function(err) {
      that.addLog('失败: ' + err.message);
    });
  },

  // ============ 测试4: 根据ID查单条记录 ============
  testFetchOne() {
    var that = this;
    var db = wx.cloud.database();
    that.addLog('--- 测试: 查第一条记录的详情 ---');

    // 先获取第一条记录的_id
    db.collection('vaccines').limit(1).get().then(function(res) {
      if (res.data.length === 0) {
        that.addLog('数据库无记录');
        return;
      }
      var firstId = res.data[0]._id;
      that.addLog('第一条记录 _id=' + firstId);

      // 再根据_id查详情
      return db.collection('vaccines').doc(firstId).get().then(function(docRes) {
        if (docRes.data) {
          var d = docRes.data;
          that.addLog('详情加载成功!');
          that.addLog('  原始字段: ' + JSON.stringify(Object.keys(d)));
          that.addLog('  yimiaomingcheng=' + d.yimiaomingcheng);
          that.addLog('  name=' + d.name);
          that.addLog('  tixingshijian=' + d.tixingshijian);
          that.addLog('  dueDate=' + d.dueDate);
          that.addLog('  jiezhongdidian=' + d.jiezhongdidian);
          that.addLog('  location=' + d.location);
          that.addLog('  zhuangtai=' + d.zhuangtai);
          that.addLog('  status=' + d.status);
          that.addLog('  userId=' + d.userId);
          that.addLog('  完整数据: ' + JSON.stringify(d).substring(0, 500));
        } else {
          that.addLog('doc(id).get() 返回但 data 为空');
        }
      });
    }).catch(function(err) {
      that.addLog('失败: ' + err.message);
    });
  },

  // ============ 测试5: 模拟list页面的点击流程 ============
  testClickFlow() {
    var that = this;
    var db = wx.cloud.database();
    that.addLog('--- 测试: 模拟列表点击流程 ---');
    var uid = this.data.userId;

    db.collection('vaccines').where({ userId: uid }).limit(1).get().then(function(res) {
      if (res.data.length === 0) {
        that.addLog('当前用户无记录');
        return;
      }
      var item = res.data[0];
      var recordId = item._id;
      that.addLog('Step1: 列表数据: _id=' + recordId);
      that.addLog('  yimiaomingcheng=' + (item.yimiaomingcheng || '无'));
      that.addLog('  name=' + (item.name || '无'));

      // 模拟点击 navigator
      that.addLog('Step2: 模拟跳转: mode=update&id=' + recordId);

      // 模拟详情页 loadRecord
      that.addLog('Step3: 详情页调用 doc(' + recordId + ').get()');
      return db.collection('vaccines').doc(recordId).get().then(function(docRes) {
        if (docRes.data) {
          var d = docRes.data;
          that.addLog('Step4: 详情加载成功!');
          that.addLog('  疫苗名称解析: ' + (d.yimiaomingcheng || d.name || '(空)'));
          that.addLog('  提醒时间解析: ' + (d.tixingshijian || d.dueDate || '(空)'));
          that.addLog('  接种地点解析: ' + (d.jiezhongdidian || d.location || '(空)'));
          that.addLog('  状态解析: ' + (d.zhuangtai || d.status || '(空)'));
        } else {
          that.addLog('Step4: doc().get() 返回空');
        }
      });
    }).catch(function(err) {
      that.addLog('失败: ' + err.message);
    });
  },

  // ============ 测试6: 显示recordList完整数据 ============
  testRecordList() {
    var that = this;
    that.addLog('--- 测试: 当前 recordList 状态 ---');
    var pages = getCurrentPages();
    var listPage = pages[pages.length - 2] || null;
    if (listPage && listPage.data && listPage.data.recordList) {
      var list = listPage.data.recordList;
      that.addLog('list页 recordList 共 ' + list.length + ' 条');
      list.forEach(function(item, i) {
        that.addLog('[' + i + '] _id=' + item._id +
          ' name=' + (item.yimiaomingcheng || '无') +
          ' date=' + (item.tixingshijian || '无'));
      });
    } else {
      that.addLog('无法获取list页数据');
    }
  },

  clearLogs() {
    this.setData({ logs: [] });
  }
});
