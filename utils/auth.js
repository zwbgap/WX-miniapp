const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_INFO_KEY = 'userInfo';

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token);
}

function removeToken() {
  wx.removeStorageSync(TOKEN_KEY);
}

function getRefreshToken() {
  return wx.getStorageSync(REFRESH_TOKEN_KEY) || '';
}

function setRefreshToken(refreshToken) {
  wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
}

function removeRefreshToken() {
  wx.removeStorageSync(REFRESH_TOKEN_KEY);
}

function getUserInfo() {
  return wx.getStorageSync(USER_INFO_KEY) || null;
}

function setUserInfo(userInfo) {
  wx.setStorageSync(USER_INFO_KEY, userInfo);
}

function removeUserInfo() {
  wx.removeStorageSync(USER_INFO_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function clearAll() {
  removeToken();
  removeRefreshToken();
  removeUserInfo();
}

function parseJwtPayload(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwtPayload(token || getToken());
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + 60;
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  isLoggedIn,
  clearAll,
  parseJwtPayload,
  isTokenExpired
};
