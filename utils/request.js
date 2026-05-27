const app = getApp();

const BASE_URL = 'http://localhost:8080';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');

    const header = {
      'Content-Type': 'application/json',
      ...options.header
    };

    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions = {
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      timeout: options.timeout || 10000,
      success: (res) => {
        if (res.statusCode === 200) {
          const body = res.data;
          if (body.code === 0) {
            resolve(body.data !== undefined ? body.data : body);
          } else if (body.code === 401) {
            handleTokenExpired(options, resolve, reject);
          } else {
            wx.showToast({
              title: body.message || '请求失败',
              icon: 'none',
              duration: 2000
            });
            reject(new Error(body.message || '请求失败'));
          }
        } else if (res.statusCode === 401) {
          handleTokenExpired(options, resolve, reject);
        } else if (res.statusCode === 403) {
          wx.showToast({ title: '没有操作权限', icon: 'none' });
          reject(new Error('没有操作权限'));
        } else if (res.statusCode === 404) {
          wx.showToast({ title: '请求的资源不存在', icon: 'none' });
          reject(new Error('请求的资源不存在'));
        } else if (res.statusCode === 500) {
          wx.showToast({ title: '服务器错误，请稍后重试', icon: 'none' });
          reject(new Error('服务器内部错误'));
        } else {
          wx.showToast({ title: `请求失败(${res.statusCode})`, icon: 'none' });
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络异常，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    };

    wx.request(requestOptions);
  });
}

function handleTokenExpired(originalOptions, resolve, reject) {
  if (!isRefreshing) {
    isRefreshing = true;

    const refreshToken = wx.getStorageSync('refreshToken');
    if (!refreshToken) {
      isRefreshing = false;
      refreshSubscribers = [];
      app.logout();
      wx.navigateTo({ url: '/pages/login/login' });
      reject(new Error('登录已过期，请重新登录'));
      return;
    }

    wx.request({
      url: BASE_URL + '/refresh-token',
      method: 'POST',
      data: { refreshToken: refreshToken },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          const { token, refreshToken: newRefreshToken } = res.data.data;
          wx.setStorageSync('token', token);
          wx.setStorageSync('refreshToken', newRefreshToken);
          app.globalData.token = token;
          app.globalData.refreshToken = newRefreshToken;
          onTokenRefreshed(token);
          isRefreshing = false;

          request(originalOptions).then(resolve).catch(reject);
        } else {
          isRefreshing = false;
          refreshSubscribers = [];
          app.logout();
          wx.navigateTo({ url: '/pages/login/login' });
          reject(new Error('登录已过期，请重新登录'));
        }
      },
      fail: () => {
        isRefreshing = false;
        refreshSubscribers = [];
        app.logout();
        wx.navigateTo({ url: '/pages/login/login' });
        reject(new Error('网络异常，无法刷新令牌'));
      }
    });
  } else {
    subscribeTokenRefresh(() => {
      request(originalOptions).then(resolve).catch(reject);
    });
  }
}

const http = {
  get(url, data = {}, options = {}) {
    return request({
      url,
      method: 'GET',
      data,
      ...options
    });
  },

  post(url, data = {}, options = {}) {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    });
  },

  put(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    });
  },

  delete(url, data = {}, options = {}) {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options
    });
  },

  patch(url, data = {}, options = {}) {
    return request({
      url,
      method: 'PATCH',
      data,
      ...options
    });
  },

  upload(url, filePath, name = 'file', formData = {}) {
    const token = wx.getStorageSync('token');
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: BASE_URL + url,
        filePath: filePath,
        name: name,
        formData: formData,
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data.data !== undefined ? data.data : data);
            } else {
              wx.showToast({ title: data.message || '上传失败', icon: 'none' });
              reject(new Error(data.message || '上传失败'));
            }
          } else if (res.statusCode === 401) {
            app.logout();
            wx.navigateTo({ url: '/pages/login/login' });
            reject(new Error('登录已过期'));
          } else {
            reject(new Error(`上传失败(${res.statusCode})`));
          }
        },
        fail: (err) => {
          wx.showToast({ title: '上传失败，请检查网络', icon: 'none' });
          reject(err);
        }
      });
    });
  }
};

module.exports = http;
