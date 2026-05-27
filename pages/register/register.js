Page({
  data: {
    account: '',
    password: '',
    confirmPassword: '',
    agreementChecked: false,
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

  onTogglePasswordVisible() {
    this.setData({ passwordVisible: !this.data.passwordVisible });
  },

  onToggleConfirmPasswordVisible() {
    this.setData({ confirmPasswordVisible: !this.data.confirmPasswordVisible });
  },

  onToggleAgreement() {
    this.setData({ agreementChecked: !this.data.agreementChecked });
  },

  async onSubmit() {
    var account = this.data.account.trim();
    var password = this.data.password;
    var confirmPassword = this.data.confirmPassword;

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
    if (!this.data.agreementChecked) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' });
      return;
    }

    this.setData({ submitLoading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'register',
        data: {
          account: account,
          password: password
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
  },

  onAgreementTap() {
    wx.showModal({
      title: '用户协议',
      content: '感谢您使用个人健康档案管理系统。本协议规定了您使用本服务的条款和条件...',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  onPrivacyTap() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息...',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});