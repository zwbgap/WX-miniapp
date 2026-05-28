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
    },
    inviteCode: '',
    isAdminView: false,
    isEditable: false
  },

  onLoad(options) {
    if (options.mode === 'admin') {
      this.setData({ 
        isAdminView: true,
        isEditable: false
      });
      if (options.doctorId) {
        this.loadDoctorInfoById(options.doctorId);
      }
    } else {
      if (!ensureDoctor()) return;
      this.loadDoctorInfo();
    }
  },

  onShow() {
    if (!this.data.isAdminView) {
      ensureDoctor();
    }
  },

  async loadDoctorInfoById(doctorId) {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const result = await db.collection('users').doc(doctorId).get();
      
      if (result.data) {
        const doctor = result.data;
        let inviteCode = doctor.inviteCode || '';
        
        if (!inviteCode && doctor.account) {
          const inviteResult = await db.collection('doctor_invites')
            .where({ usedBy: doctor.account })
            .get();
          
          if (inviteResult.data.length > 0) {
            inviteCode = inviteResult.data[0].code;
          }
        }
        
        this.setData({
          form: {
            nickName: doctor.nickName || '',
            employeeId: doctor.employeeId || '',
            phone: doctor.phone || '',
            department: doctor.department || '',
            title: doctor.title || '',
            email: doctor.email || '',
            address: doctor.address || ''
          },
          inviteCode: inviteCode
        });
      }
    } catch (err) {
      console.error('加载医生信息失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
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
        let inviteCode = doctor.inviteCode || '';
        
        console.log('doctor信息:', doctor);
        console.log('从users读取的inviteCode:', inviteCode);
        
        // 如果users集合中没有邀请码，直接从doctor_invites集合查询
        if (!inviteCode && doctor.account) {
          const inviteResult = await db.collection('doctor_invites')
            .where({ usedBy: doctor.account })
            .get();
          
          console.log('doctor_invites查询结果:', inviteResult);
          
          if (inviteResult.data.length > 0) {
            inviteCode = inviteResult.data[0].code;
            console.log('找到邀请码:', inviteCode);
          }
        }
        
        this.setData({
          form: {
            nickName: doctor.nickName || '',
            employeeId: doctor.employeeId || '',
            phone: doctor.phone || '',
            department: doctor.department || '',
            title: doctor.title || '',
            email: doctor.email || '',
            address: doctor.address || ''
          },
          inviteCode: inviteCode
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
