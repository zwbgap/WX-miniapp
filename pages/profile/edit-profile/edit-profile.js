Page({
  data: {
    loading: false,
    submitting: false,

    form: {
      nickName: '',
      accountId: '',
      xingming: '',
      nianling: '',
      xuexing: '',
      shengao: '',
      jiazu_gaoxueya: '无',
      jiazu_tangniaobing: '无',
      jiazu_xinzang: '无',
      jiazu_qita: '',
      jinji_lianxiren: '',
      jinji_dianhua: '',
      jinji_yibao: '职工医保',
      jinjicheng_duixiang: '无'
    },

    bloodTypeColumns: ['A型', 'B型', 'AB型', 'O型'],
    pickerVisible: false,
    pickerType: '',
    pickerValue: 0,

    doctorPickerVisible: false,
    doctors: [],
    selectedDoctorId: null,
    selectedDoctor: null,
    selectedDoctorName: '未绑定'
  },

  onLoad() {
    this.loadUserData();
  },

  async loadUserData() {
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '用户未登录', icon: 'none' });
        return;
      }

      this.setData({
        'form.accountId': userInfo.account || userInfo._id,
        'form.nickName': userInfo.nickName || ''
      });

      const db = wx.cloud.database();

      // 从 user_profiles 加载已保存数据
      const profileResult = await db.collection('user_profiles')
        .where({ userId: userInfo._id })
        .limit(1)
        .get();

      if (profileResult.data && profileResult.data.length > 0) {
        const p = profileResult.data[0];
        this.setData({
          form: {
            ...this.data.form,
            xingming: p.xingming || '',
            nianling: p.nianling ? String(p.nianling) : '',
            xuexing: p.xuexing || '',
            shengao: p.shengao ? String(p.shengao) : '',
            jiazu_gaoxueya: p.jiazu_gaoxueya || '无',
            jiazu_tangniaobing: p.jiazu_tangniaobing || '无',
            jiazu_xinzang: p.jiazu_xinzang || '无',
            jiazu_qita: p.jiazu_qita || '',
            jinji_lianxiren: p.jinji_lianxiren || '',
            jinji_dianhua: p.jinji_dianhua || '',
            jinji_yibao: p.jinji_yibao || '职工医保',
            jinjicheng_duixiang: p.jinjicheng_duixiang || '无'
          }
        });
        if (p.doctorId && p.doctorInfo) {
          this.setData({
            selectedDoctorId: p.doctorId,
            selectedDoctor: p.doctorInfo,
            selectedDoctorName: p.doctorInfo.nickName || '未知医生'
          });
        }
      }

      this.setData({ loading: false });
    } catch (err) {
      console.error('加载用户数据失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
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

  onFieldChange(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail;
    var form = this.data.form;
    form[field] = value;
    this.setData({ form: form });
  },

  onRadioChange(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail;
    var form = this.data.form;
    form[field] = value;
    this.setData({ form: form });
  },

  onOpenPicker(e) {
    var type = e.currentTarget.dataset.type;
    var currentValue = this.data.form.xuexing || '';
    var columns = this.data.bloodTypeColumns;
    var index = columns.indexOf(currentValue);
    this.setData({
      pickerVisible: true,
      pickerType: type,
      pickerValue: index >= 0 ? index : 0
    });
  },

  onPickerConfirm(e) {
    var form = this.data.form;
    form.xuexing = e.detail.value;
    this.setData({ form: form, pickerVisible: false });
  },

  onPickerCancel() {
    this.setData({ pickerVisible: false });
  },

  onOpenDoctorPicker() {
    this.loadDoctors();
    this.setData({ doctorPickerVisible: true });
  },

  onDoctorPickerCancel() {
    this.setData({ doctorPickerVisible: false });
  },

  onSelectDoctor(e) {
    const doctorId = e.currentTarget.dataset.id;
    
    if (this.data.selectedDoctorId === doctorId) {
      this.setData({ selectedDoctorId: null });
    } else {
      this.setData({ selectedDoctorId: doctorId });
    }
  },

  onDoctorPickerConfirm() {
    if (!this.data.selectedDoctorId) {
      wx.showToast({ title: '请选择医生', icon: 'none' });
      return;
    }
    
    const doctor = this.data.doctors.find(d => d._id === this.data.selectedDoctorId);
    
    if (doctor) {
      this.setData({
        selectedDoctor: {
          _id: doctor._id,
          account: doctor.account,
          nickName: doctor.nickName,
          employeeId: doctor.employeeId,
          phone: doctor.phone,
          department: doctor.department,
          title: doctor.title
        },
        selectedDoctorName: doctor.nickName || doctor.account,
        doctorPickerVisible: false
      });
      
      wx.showToast({ title: '绑定成功', icon: 'success' });
    }
  },

  validateForm() {
    var f = this.data.form;
    if (!f.nickName.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return false;
    }
    if (!f.xingming.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!f.nianling || parseInt(f.nianling) <= 0 || parseInt(f.nianling) > 150) {
      wx.showToast({ title: '请输入有效年龄', icon: 'none' });
      return false;
    }
    if (!f.shengao || parseInt(f.shengao) < 50 || parseInt(f.shengao) > 250) {
      wx.showToast({ title: '请输入有效身高(50-250cm)', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;

    var f = this.data.form;
    this.setData({ submitting: true });

    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '用户未登录', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      const app = getApp();
      app.globalData.userInfo.nickName = f.nickName.trim();
      wx.setStorageSync('userInfo', app.globalData.userInfo);

      await wx.cloud.callFunction({
        name: 'updateUser',
        data: {
          userId: userInfo._id,
          nickName: f.nickName.trim()
        }
      });

      const db = wx.cloud.database();
      const existResult = await db.collection('health_records')
        .where({ userId: userInfo._id })
        .limit(1)
        .get();

      var recordData = {
        xingming: f.xingming.trim(),
        nianling: parseInt(f.nianling) || 0,
        xuexing: f.xuexing || '',
        shengao: parseInt(f.shengao) || 0,
        jiazu_gaoxueya: f.jiazu_gaoxueya || '无',
        jiazu_tangniaobing: f.jiazu_tangniaobing || '无',
        jiazu_xinzang: f.jiazu_xinzang || '无',
        jiazu_qita: f.jiazu_qita ? f.jiazu_qita.trim() : '',
        jinji_lianxiren: f.jinji_lianxiren ? f.jinji_lianxiren.trim() : '',
        jinji_dianhua: f.jinji_dianhua ? f.jinji_dianhua.trim() : '',
        jinji_yibao: f.jinji_yibao || '职工医保',
        jinjicheng_duixiang: f.jinjicheng_duixiang || '无',
        updatedAt: db.serverDate()
      };

      if (existResult.data && existResult.data.length > 0) {
        await db.collection('health_records').doc(existResult.data[0]._id).update({
          data: recordData
        });
      } else {
        recordData.userId = userInfo._id;
        recordData.recordDate = new Date().toISOString().split('T')[0];
        recordData.createdAt = db.serverDate();
        await db.collection('health_records').add({ data: recordData });
      }

      const profileResult = await wx.cloud.callFunction({
        name: 'saveUserProfile',
        data: {
          userId: userInfo._id,
          profile: recordData,
          doctorId: this.data.selectedDoctorId
        }
      });

      if (profileResult.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: profileResult.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
