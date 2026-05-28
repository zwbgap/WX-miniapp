const { ensureDoctor } = require('../../../utils/security');

Page({
  data: {
    loading: false,
    submitting: false,
    form: {
      nickName: '',
      employeeId: '',
      phone: '',
      department: '',
      title: '',
      email: '',
      address: ''
    }
  },

  onLoad() {
    if (!ensureDoctor()) return;
    this.loadDoctorInfo();
  },

  onShow() {
    ensureDoctor();
  },

  async loadDoctorInfo() {
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      const db = wx.cloud.database();
      const result = await db.collection('users').doc(userInfo._id).get();
      
      if (result.data) {
        const doctor = result.data;
        this.setData({
          form: {
            nickName: doctor.nickName || '',
            employeeId: doctor.employeeId || '',
            phone: doctor.phone || '',
            department: doctor.department || '',
            title: doctor.title || '',
            email: doctor.email || '',
            address: doctor.address || ''
          }
        });
      }
    } catch (err) {
      console.error('加载医生信息失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const form = { ...this.data.form };
    form[field] = value;
    this.setData({ form });
  },

  validateForm() {
    const { nickName, employeeId, phone, department, title } = this.data.form;
    
    if (!nickName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!employeeId.trim()) {
      wx.showToast({ title: '请输入工号', icon: 'none' });
      return false;
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请输入电话号码', icon: 'none' });
      return false;
    }
    if (!department.trim()) {
      wx.showToast({ title: '请输入科室', icon: 'none' });
      return false;
    }
    if (!title.trim()) {
      wx.showToast({ title: '请输入职称', icon: 'none' });
      return false;
    }
    
    if (phone.length !== 11) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' });
      return false;
    }
    
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;

    this.setData({ submitting: true });

    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '用户未登录', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      const { nickName, employeeId, phone, department, title, email, address } = this.data.form;

      const result = await wx.cloud.callFunction({
        name: 'updateDoctorInfo',
        data: {
          doctorId: userInfo._id,
          nickName: nickName.trim(),
          employeeId: employeeId.trim(),
          phone: phone.trim(),
          department: department.trim(),
          title: title.trim(),
          email: email || '',
          address: address || ''
        }
      });

      if (result.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        
        userInfo.nickName = nickName.trim();
        wx.setStorageSync('userInfo', userInfo);
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
