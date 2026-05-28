function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

function maskIdCard(idCard) {
  if (!idCard || idCard.length < 8) return idCard || '';
  return idCard.substring(0, 4) + '**********' + idCard.substring(idCard.length - 4);
}

function maskName(name) {
  if (!name) return '';
  if (name.length === 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

function maskEmail(email) {
  if (!email) return '';
  var parts = email.split('@');
  if (parts.length !== 2) return email;
  var name = parts[0];
  if (name.length <= 2) return name[0] + '***@' + parts[1];
  return name.substring(0, 2) + '***@' + parts[1];
}

var AES_KEY = 'health-record-app';

function simpleEncrypt(str) {
  if (!str) return '';
  var result = '';
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    var keyCode = AES_KEY.charCodeAt(i % AES_KEY.length);
    result += String.fromCharCode(code ^ keyCode);
  }
  return base64Encode(result);
}

function simpleDecrypt(encrypted) {
  try {
    var decoded = base64Decode(encrypted);
    var result = '';
    for (var i = 0; i < decoded.length; i++) {
      var code = decoded.charCodeAt(i);
      var keyCode = AES_KEY.charCodeAt(i % AES_KEY.length);
      result += String.fromCharCode(code ^ keyCode);
    }
    return result;
  } catch (e) {
    return '';
  }
}

function base64Encode(str) {
  var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var result = '';
  var i = 0;
  for (i = 0; i < str.length - 2; i += 3) {
    var a = str.charCodeAt(i);
    var b = str.charCodeAt(i + 1);
    var c = str.charCodeAt(i + 2);
    result += base64Chars.charAt(a >> 2);
    result += base64Chars.charAt(((a & 3) << 4) | (b >> 4));
    result += base64Chars.charAt(((b & 15) << 2) | (c >> 6));
    result += base64Chars.charAt(c & 63);
  }
  if (i < str.length) {
    var a = str.charCodeAt(i);
    result += base64Chars.charAt(a >> 2);
    if (i + 1 < str.length) {
      var b = str.charCodeAt(i + 1);
      result += base64Chars.charAt(((a & 3) << 4) | (b >> 4));
      result += base64Chars.charAt((b & 15) << 2);
    } else {
      result += base64Chars.charAt((a & 3) << 4);
      result += '=';
    }
    result += '=';
  }
  return result;
}

function base64Decode(str) {
  var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var result = '';
  var i = 0;

  var decodeMap = {};
  for (var j = 0; j < base64Chars.length; j++) {
    decodeMap[base64Chars[j]] = j;
  }

  var cleanStr = str.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < cleanStr.length) {
    var a = decodeMap[cleanStr[i++]];
    var b = decodeMap[cleanStr[i++]];
    var c = decodeMap[cleanStr[i++]];
    var d = decodeMap[cleanStr[i++]];

    result += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 64) {
      result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d !== 64) {
        result += String.fromCharCode(((c & 3) << 6) | d);
      }
    }
  }

  return result;
}

function secureStore(key, value) {
  try {
    var encrypted = typeof value === 'string' ? simpleEncrypt(value) : simpleEncrypt(JSON.stringify(value));
    wx.setStorageSync(key, encrypted);
  } catch (e) {
    console.warn('安全存储失败:', e);
  }
}

function secureRead(key) {
  try {
    var encrypted = wx.getStorageSync(key);
    if (!encrypted) return null;
    var decrypted = simpleDecrypt(encrypted);
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return decrypted;
    }
  } catch (e) {
    return null;
  }
}

function checkPermission(permission, userInfo) {
  if (!userInfo) return false;
  var role = userInfo.role || 'user';

  var permissions = {
    'admin': ['view', 'edit', 'delete', 'export', 'manage'],
    'doctor': ['view', 'edit', 'export'],
    'user': ['view', 'edit', 'delete_own']
  };

  var allowed = permissions[role] || [];
  return allowed.indexOf(permission) !== -1;
}

function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

function validateInput(input, type) {
  if (!input && type !== 'optional') return false;

  var patterns = {
    phone: /^1[3-9]\d{9}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    idCard: /^\d{17}[\dXx]$/,
    number: /^\d+$/,
    optional: true
  };

  var pattern = patterns[type];
  if (!pattern) return true;
  if (type === 'optional') return true;
  return pattern.test(input || '');
}

function getUserIdentity() {
  const app = getApp();
  const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
  if (!userInfo) return null;
  return userInfo.identity || userInfo.role || null;
}

function checkDoctorIdentity() {
  const identity = getUserIdentity();
  return identity === 'doctor';
}

function checkAdminIdentity() {
  const identity = getUserIdentity();
  return identity === 'admin';
}

function checkUserIdentity() {
  const identity = getUserIdentity();
  return !identity || identity === 'user';
}

function redirectToLogin() {
  wx.redirectTo({ url: '/pages/login/login' });
}

function ensureDoctor() {
  if (!checkDoctorIdentity()) {
    redirectToLogin();
    return false;
  }
  return true;
}

function ensureAdmin() {
  if (!checkAdminIdentity()) {
    redirectToLogin();
    return false;
  }
  return true;
}

function ensureUser() {
  if (!checkUserIdentity()) {
    const identity = getUserIdentity();
    if (identity === 'doctor') {
      wx.redirectTo({ url: '/pages/doctor/index/index' });
    } else if (identity === 'admin') {
      wx.redirectTo({ url: '/pages/admin/index/index' });
    } else {
      redirectToLogin();
    }
    return false;
  }
  return true;
}

module.exports = {
  maskPhone: maskPhone,
  maskIdCard: maskIdCard,
  maskName: maskName,
  maskEmail: maskEmail,
  simpleEncrypt: simpleEncrypt,
  simpleDecrypt: simpleDecrypt,
  secureStore: secureStore,
  secureRead: secureRead,
  checkPermission: checkPermission,
  sanitizeHtml: sanitizeHtml,
  validateInput: validateInput,
  getUserIdentity: getUserIdentity,
  checkDoctorIdentity: checkDoctorIdentity,
  checkAdminIdentity: checkAdminIdentity,
  checkUserIdentity: checkUserIdentity,
  redirectToLogin: redirectToLogin,
  ensureDoctor: ensureDoctor,
  ensureAdmin: ensureAdmin,
  ensureUser: ensureUser
};
