const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';
const REMEMBERED_ACCOUNT_KEY = 'rememberedAccount';
const BASE_URL = 'http://localhost:8080';

let refreshPromise = null;

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
  const app = getApp();
  if (app) app.globalData.token = token;
}

function removeToken() {
  wx.removeStorageSync(TOKEN_KEY);
}

function getRefreshToken() {
  return wx.getStorageSync(REFRESH_TOKEN_KEY) || '';
}

function setRefreshToken(refreshToken) {
  wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
  const app = getApp();
  if (app) app.globalData.refreshToken = refreshToken;
}

function removeRefreshToken() {
  wx.removeStorageSync(REFRESH_TOKEN_KEY);
}

function getUserInfo() {
  return wx.getStorageSync(USER_INFO_KEY) || null;
}

function setUserInfo(userInfo) {
  wx.setStorageSync(USER_INFO_KEY, userInfo);
  const app = getApp();
  if (app) app.globalData.userInfo = userInfo;
}

function removeUserInfo() {
  wx.removeStorageSync(USER_INFO_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function saveLoginState(token, refreshToken, userInfo) {
  setToken(token);
  setRefreshToken(refreshToken);
  setUserInfo(userInfo);
  const app = getApp();
  if (app) {
    app.globalData.token = token;
    app.globalData.refreshToken = refreshToken;
    app.globalData.userInfo = userInfo;
    app.globalData.isLoggedIn = true;
  }
}

function clearLoginState() {
  removeToken();
  removeRefreshToken();
  removeUserInfo();
  const app = getApp();
  if (app) {
    app.globalData.token = null;
    app.globalData.refreshToken = null;
    app.globalData.userInfo = null;
    app.globalData.isLoggedIn = false;
  }
}

function parseJwtPayload(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token) {
  var payload = parseJwtPayload(token || getToken());
  if (!payload || !payload.exp) return true;
  var now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + 60;
}

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  var refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    return Promise.reject(new Error('无刷新令牌'));
  }

  refreshPromise = new Promise(function(resolve, reject) {
    wx.request({
      url: BASE_URL + '/refresh-token',
      method: 'POST',
      data: { refreshToken: refreshTokenValue },
      header: { 'Content-Type': 'application/json' },
      success: function(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          var data = res.data.data || res.data;
          setToken(data.token);
          if (data.refreshToken) {
            setRefreshToken(data.refreshToken);
          }
          refreshPromise = null;
          resolve(data.token);
        } else {
          clearLoginState();
          refreshPromise = null;
          reject(new Error(res.data.message || 'Token刷新失败'));
        }
      },
      fail: function(err) {
        refreshPromise = null;
        reject(err);
      }
    });
  });

  return refreshPromise;
}

function ensureValidToken() {
  if (!isLoggedIn()) {
    return Promise.reject(new Error('未登录'));
  }

  if (isTokenExpired()) {
    return refreshAccessToken();
  }

  return Promise.resolve(getToken());
}

function rememberAccount(account, password) {
  try {
    wx.setStorageSync(REMEMBERED_ACCOUNT_KEY, JSON.stringify({
      account: account,
      password: password,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

function getRememberedAccount() {
  try {
    var data = wx.getStorageSync(REMEMBERED_ACCOUNT_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {}
  return null;
}

function clearRememberedAccount() {
  wx.removeStorageSync(REMEMBERED_ACCOUNT_KEY);
}

module.exports = {
  getToken: getToken,
  setToken: setToken,
  removeToken: removeToken,
  getRefreshToken: getRefreshToken,
  setRefreshToken: setRefreshToken,
  removeRefreshToken: removeRefreshToken,
  getUserInfo: getUserInfo,
  setUserInfo: setUserInfo,
  removeUserInfo: removeUserInfo,
  isLoggedIn: isLoggedIn,
  saveLoginState: saveLoginState,
  clearLoginState: clearLoginState,
  parseJwtPayload: parseJwtPayload,
  isTokenExpired: isTokenExpired,
  refreshAccessToken: refreshAccessToken,
  ensureValidToken: ensureValidToken,
  rememberAccount: rememberAccount,
  getRememberedAccount: getRememberedAccount,
  clearRememberedAccount: clearRememberedAccount
};
