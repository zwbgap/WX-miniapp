var DEFAULT_CACHE_TIME = 5 * 60 * 1000;

var cache = {
  _store: {},

  set: function(key, data, expireTime) {
    var expire = expireTime || DEFAULT_CACHE_TIME;
    this._store[key] = {
      data: data,
      expire: Date.now() + expire
    };
    try {
      wx.setStorageSync('_cache_' + key, JSON.stringify(this._store[key]));
    } catch (e) {}
  },

  get: function(key) {
    if (this._store[key] && Date.now() < this._store[key].expire) {
      return this._store[key].data;
    }

    try {
      var raw = wx.getStorageSync('_cache_' + key);
      if (raw) {
        var item = JSON.parse(raw);
        if (Date.now() < item.expire) {
          this._store[key] = item;
          return item.data;
        }
      }
    } catch (e) {}

    return null;
  },

  remove: function(key) {
    delete this._store[key];
    try {
      wx.removeStorageSync('_cache_' + key);
    } catch (e) {}
  },

  clearAll: function() {
    this._store = {};
    try {
      var info = wx.getStorageInfoSync();
      info.keys.forEach(function(k) {
        if (k.startsWith('_cache_')) {
          wx.removeStorageSync(k);
        }
      });
    } catch (e) {}
  }
};

function debounce(fn, delay) {
  var timer = null;
  return function() {
    var context = this;
    var args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, delay);
  };
}

function throttle(fn, interval) {
  var lastTime = 0;
  return function() {
    var now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, arguments);
    }
  };
}

function imageLazyLoad(selector, context) {
  var ctx = context || wx.createSelectorQuery();
  if (typeof ctx.selectAll === 'function') {
    ctx.selectAll(selector).fields({
      rect: true,
      size: true
    }).exec(function(res) {
      if (res && res[0]) {
        res[0].forEach(function(item) {
          if (item && item.top < wx.getSystemInfoSync().windowHeight * 1.5) {
            item._loading = true;
          }
        });
      }
    });
  }
}

var preloadQueue = [];
var preloading = false;

function preloadPage(url) {
  if (preloadQueue.indexOf(url) === -1) {
    preloadQueue.push(url);
  }
  processPreloadQueue();
}

function processPreloadQueue() {
  if (preloading || preloadQueue.length === 0) return;

  preloading = true;
  var url = preloadQueue.shift();

  wx.request({
    url: url,
    method: 'GET',
    success: function() {
      preloading = false;
      processPreloadQueue();
    },
    fail: function() {
      preloading = false;
      processPreloadQueue();
    }
  });
}

function setStorageWithExpire(key, value, expireMs) {
  var item = {
    value: value,
    expire: expireMs ? Date.now() + expireMs : 0
  };
  try {
    wx.setStorageSync(key, JSON.stringify(item));
  } catch (e) {
    console.warn('存储失败:', e);
  }
}

function getStorageWithExpire(key) {
  try {
    var raw = wx.getStorageSync(key);
    if (!raw) return null;
    var item = JSON.parse(raw);
    if (item.expire > 0 && Date.now() > item.expire) {
      wx.removeStorageSync(key);
      return null;
    }
    return item.value;
  } catch (e) {
    return null;
  }
}

var reLaunchLocked = false;

function safeReLaunch(url) {
  if (reLaunchLocked) return;
  reLaunchLocked = true;
  wx.reLaunch({
    url: url,
    fail: function() {
      reLaunchLocked = false;
    },
    complete: function() {
      setTimeout(function() {
        reLaunchLocked = false;
      }, 1000);
    }
  });
}

function batchSetData(context, dataObj) {
  return new Promise(function(resolve) {
    context.setData(dataObj, function() {
      resolve();
    });
  });
}

function measurePerformance(label) {
  var start;
  return {
    start: function() {
      start = Date.now();
    },
    end: function() {
      var elapsed = Date.now() - start;
      if (elapsed > 500) {
        console.warn('[Perf] ' + label + ' 耗时: ' + elapsed + 'ms');
      }
    }
  };
}

module.exports = {
  cache: cache,
  debounce: debounce,
  throttle: throttle,
  imageLazyLoad: imageLazyLoad,
  preloadPage: preloadPage,
  setStorageWithExpire: setStorageWithExpire,
  getStorageWithExpire: getStorageWithExpire,
  safeReLaunch: safeReLaunch,
  batchSetData: batchSetData,
  measurePerformance: measurePerformance
};
