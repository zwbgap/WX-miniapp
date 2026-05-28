Page({
  data: {
    account: '',
    password: '',
    inviteCode: '',
    rememberPassword: false,
    passwordVisible: false,
    accountLoading: false,
    identity: 'user'
  },

  onLoad() {
    const remembered = this.getRememberedAccount();
    if (remembered) {
      this.setData({
        account: remembered.account || '',
        password: remembered.password || '',
        rememberPassword: true,
        identity: remembered.identity || 'user'
      });
    }
  },

  getRememberedAccount() {
    try {
      const data = wx.getStorageSync('rememberedAccount');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  rememberAccount(account, password, identity) {
    wx.setStorageSync('rememberedAccount', JSON.stringify({ account, password, identity }));
  },

  clearRememberedAccount() {
    wx.removeStorageSync('rememberedAccount');
  },

  onAccountInput(e) {
    this.setData({ account: e.detail });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail });
  },

  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail });
  },

  onTogglePasswordVisible() {
    console.log('切换密码可见性，当前状态:', this.data.passwordVisible);
    this.setData({ passwordVisible: !this.data.passwordVisible });
    console.log('切换后状态:', !this.data.passwordVisible);
  },

  onToggleRemember() {
    this.setData({ rememberPassword: !this.data.rememberPassword });
  },

  onSelectIdentity(e) {
    const identity = e.currentTarget.dataset.identity;
    this.setData({ identity });
  },

  async onAccountLogin() {
    var account = this.data.account.trim();
    var password = this.data.password;
    var identity = this.data.identity;

    if (!account) {
      wx.showToast({ title: '请输入账号', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ accountLoading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'accountLogin',
        data: {
          account: account,
          password: password,
          identity: identity,
          inviteCode: identity === 'doctor' ? this.data.inviteCode : ''
        }
      });

      if (result.result.code === 0) {
        const userInfo = result.result.data;
        userInfo.identity = identity;

        if (!userInfo.avatarUrl && identity !== 'admin') {
          const seed = userInfo.account || userInfo._id || Math.random().toString(36);
          const avatarStyles = ['avataaars', 'bottts', 'croodles', 'micah', 'miniavs', 'personas', 'pixel-art', 'shapes', 'thumbs'];
          const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
          userInfo.avatarUrl = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=200`;

          try {
            await wx.cloud.callFunction({
              name: 'updateUser',
              data: {
                userId: userInfo._id,
                avatarUrl: userInfo.avatarUrl
              }
            });
          } catch (e) {
            console.error('保存头像失败:', e);
          }
        }

        if (this.data.rememberPassword) {
          this.rememberAccount(account, password, identity);
        } else {
          this.clearRememberedAccount();
        }

        wx.setStorageSync('userInfo', userInfo);
        getApp().globalData.userInfo = userInfo;
        getApp().globalData.isLoggedIn = true;
        getApp().globalData.identity = identity;

        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          if (identity === 'doctor') {
            wx.redirectTo({ url: '/pages/doctor/index/index' });
          } else if (identity === 'admin') {
            wx.redirectTo({ url: '/pages/admin/index/index' });
          } else {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }, 800);
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ accountLoading: false });
    }
  },

  onGoRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});