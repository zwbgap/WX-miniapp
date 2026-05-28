const { ensureDoctor } = require('../../../utils/security');

Page({
  data: {
    form: {
      account: '',
      password: '',
      nickName: ''
    },
    passwordVisible: false,
    loading: false,
    doctors: []
  },

  onLoad() {
    if (!ensureDoctor()) return;
    this.loadDoctors();
  },

  onShow() {
    ensureDoctor();
    this.loadDoctors();
  },

  async loadDoctors() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getDoctors'
      });
      if (result.result.code === 0) {
        this.setData({ doctors: result.result.data });
      }
    } catch (err) {
      console.error('加载医生列表失败:', err);
    }
  },

  onAccountInput(e) {
    this.setData({ 'form.account': e.detail });
  },

  onPasswordInput(e) {
    this.setData({ 'form.password': e.detail });
  },

  onNickNameInput(e) {
    this.setData({ 'form.nickName': e.detail });
  },

  onTogglePasswordVisible() {
    this.setData({ passwordVisible: !this.data.passwordVisible });
  },

  async onAddDoctor() {
    const { account, password, nickName } = this.data.form;

    if (!account.trim()) {
      wx.showToast({ title: '请输入账号', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'addDoctor',
        data: {
          account: account.trim(),
          password: password,
          nickName: nickName.trim() || account,
          identity: 'doctor'
        }
      });

      if (result.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({
          form: { account: '', password: '', nickName: '' },
          doctors: [result.result.data, ...this.data.doctors]
        });
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('添加医生失败:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onDoctorDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: `医生ID: ${id}`, icon: 'none' });
  }
});
