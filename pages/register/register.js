Page({
  data: {
    account: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
    identity: 'user',
    passwordVisible: false,
    confirmPasswordVisible: false,
    submitLoading: false
  },

  onAccountInput(e) {
    this.setData({ account: e.detail });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail });
  },

  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail });
  },

  onTogglePasswordVisible() {
    this.setData({ passwordVisible: !this.data.passwordVisible });
  },

  onToggleConfirmPasswordVisible() {
    this.setData({ confirmPasswordVisible: !this.data.confirmPasswordVisible });
  },

  onSelectIdentity(e) {
    const identity = e.currentTarget.dataset.identity;
    this.setData({ identity });
  },

  async onSubmit() {
    var account = this.data.account.trim();
    var password = this.data.password;
    var confirmPassword = this.data.confirmPassword;
    var identity = this.data.identity;

    if (!account) {
      wx.showToast({ title: '请输入账号', icon: 'none' });
      return;
    }
    if (account.length < 3) {
      wx.showToast({ title: '账号不能少于3位', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请设置密码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码不能少于6位', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return;
    }
    if (identity === 'doctor' && !this.data.inviteCode) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }

    this.setData({ submitLoading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'register',
        data: {
          account: account,
          password: password,
          identity: identity,
          inviteCode: identity === 'doctor' ? this.data.inviteCode : ''
        }
      });

      if (result.result.code === 0) {
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('注册失败:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ submitLoading: false });
    }
  },

  onGoLogin() {
    wx.navigateBack();
  }
});