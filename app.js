var optimize = require('./utils/optimize');

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    networkStatus: true,
    systemInfo: null,
    pageCache: {},
    lastMedAlertTime: 0
  },

  onLaunch() {
    this.initCloud();
    this.checkLoginStatus();
    this.initNetworkMonitor();
    this.getSystemInfo();
    this.preloadHotPages();
    this.clearMedAlertKeys();
    this.startMedAlertTimer();
  },

  startMedAlertTimer: function() {
    var that = this;
    this.medAlertTimer = setInterval(function() {
      that.checkMedicationAlerts();
    }, 30000);
  },

  clearMedAlertKeys: function() {
    try {
      var info = wx.getStorageInfoSync();
      var keys = info.keys || [];
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('med_alert_') === 0) {
          wx.removeStorageSync(keys[i]);
        }
      }
    } catch (e) {}
  },

  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-d9gpfxefje09fa7f9',
        traceUser: true
      });
    }
    this.db = wx.cloud.database();
  },

  checkLoginStatus() {
    var userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },

  initNetworkMonitor() {
    var that = this;
    wx.getNetworkType({
      success: function(res) {
        that.globalData.networkStatus = res.networkType !== 'none';
      }
    });
    wx.onNetworkStatusChange(function(res) {
      that.globalData.networkStatus = res.isConnected;
      if (!res.isConnected) {
        wx.showToast({ title: '网络已断开', icon: 'none', duration: 2000 });
      }
    });
  },

  getSystemInfo() {
    var that = this;
    if (wx.getWindowInfo) {
      wx.getWindowInfo({
        success: function(res) {
          that.globalData.systemInfo = res;
        }
      });
    } else if (wx.getSystemInfo) {
      wx.getSystemInfo({
        success: function(res) {
          that.globalData.systemInfo = res;
        }
      });
    }
  },

  preloadHotPages() {
    var pages = [
      '/pages/index/index',
      '/pages/health-news/index',
      '/pages/profile/index'
    ];
    pages.forEach(function(url) {
      optimize.preloadPage(url);
    });
  },

  async wxLogin(callback) {
    try {
      const res = await wx.login();
      if (!res.code) {
        throw new Error('获取登录凭证失败');
      }
      
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: { code: res.code }
      });
      
      if (result.result.code === 0) {
        const data = result.result.data;
        this.globalData.userInfo = data;
        this.globalData.isLoggedIn = true;
        wx.setStorageSync('userInfo', data);
        
        if (callback && typeof callback === 'function') {
          callback(null, data);
        }
      } else {
        this.globalData.isLoggedIn = false;
        if (callback && typeof callback === 'function') {
          callback(new Error(result.result.message || '登录失败'));
        }
      }
    } catch (err) {
      if (callback && typeof callback === 'function') {
        callback(err);
      }
    }
  },

  logout() {
    optimize.cache.clearAll();
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.pageCache = {};
    wx.removeStorageSync('userInfo');
  },

  checkSession() {
    return new Promise(function(resolve, reject) {
      wx.checkSession({
        success: function() { resolve(true); },
        fail: function() {
          this.logout();
          resolve(false);
        }.bind(this)
      });
    }.bind(this));
  },

  onError(error) {
    console.error('应用全局错误:', error);
  },

  onPageNotFound(res) {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  checkMedicationAlerts: function() {
    var now = Date.now();
    if (now - this.globalData.lastMedAlertTime < 30000) {
      console.log('[弹窗] 30秒冷却中，跳过');
      return;
    }
    this.globalData.lastMedAlertTime = now;

    if (!this.globalData.isLoggedIn) {
      console.log('[弹窗] 未登录，跳过');
      return;
    }
    var userId = this.globalData.userInfo._id;
    if (!userId) {
      console.log('[弹窗] userId缺失，跳过');
      return;
    }

    console.log('[弹窗] 开始检查, userId=' + userId);
    wx.cloud.callFunction({
      name: 'getMedications',
      data: { userId: userId }
    }).then(function(res) {
      var list = (res.result && res.result.data) ? res.result.data : [];
      if (list.length === 0) {
        console.log('[弹窗] 无用药记录');
        return;
      }

      var nowDate = new Date();
      var todayStr = nowDate.getFullYear() + '-' +
        String(nowDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(nowDate.getDate()).padStart(2, '0');
      var currentH = nowDate.getHours();
      var currentM = nowDate.getMinutes();
      var currentHM = String(currentH).padStart(2, '0') + ':' + String(currentM).padStart(2, '0');

      console.log('[弹窗] 今天=' + todayStr + ' 当前时间=' + currentHM + ' 共' + list.length + '条记录');

      var matched = null;

      for (var i = 0; i < list.length; i++) {
        var med = list[i];
        if (med.status !== 'active') continue;

        var startDate = med.startDate || '';
        var endDate = med.endDate || '';

        if (startDate && todayStr < startDate) {
          console.log('[弹窗] ' + med.name + ' 还未到开始日期 ' + startDate);
          continue;
        }
        if (endDate && todayStr > endDate) {
          console.log('[弹窗] ' + med.name + ' 已超过结束日期 ' + endDate);
          continue;
        }

        var times = med.times || [];
        console.log('[弹窗] 检查 ' + med.name + ' 用药时间=' + JSON.stringify(times));

        for (var j = 0; j < times.length; j++) {
          var t = times[j];
          if (typeof t !== 'string' || t.length < 5) continue;
          var scheduledHM = t.substring(0, 5);

          if (scheduledHM === currentHM) {
            matched = med;
            console.log('[弹窗] 精确匹配! ' + med.name + ' @ ' + scheduledHM);
            break;
          }

          var parts = scheduledHM.split(':');
          var schedH = parseInt(parts[0]);
          var schedM = parseInt(parts[1]);
          var diffMin = Math.abs((currentH * 60 + currentM) - (schedH * 60 + schedM));
          if (diffMin <= 1) {
            matched = med;
            console.log('[弹窗] 模糊匹配(差' + diffMin + '分钟)! ' + med.name + ' @ ' + scheduledHM);
            break;
          }
        }
        if (matched) break;
      }

      if (!matched) {
        console.log('[弹窗] 当前时间无匹配的用药提醒');
        return;
      }

      var alertKey = 'med_alert_' + todayStr + '_' + matched._id + '_' + currentHM.substring(0, 5);
      var lastShown = wx.getStorageSync(alertKey);
      if (lastShown) {
        console.log('[弹窗] 已弹出过, key=' + alertKey);
        return;
      }

      wx.setStorageSync(alertKey, 1);
      console.log('[弹窗] 弹出提醒: ' + matched.name);
      wx.showModal({
        title: '用药提醒',
        content: '该服用「' + matched.name + '」了！\n剂量：' + (matched.dosage || '--') + '\n时间：' + currentHM,
        confirmText: '知道了',
        showCancel: false,
        success: function(modalRes) {
          console.log('[弹窗] 用户点击知道了');
        }
      });
    }).catch(function(err) {
      console.error('[弹窗] 检查失败:', err);
    });
  }
});