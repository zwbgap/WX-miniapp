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
    pickerValue: 0
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
      const result = await db.collection('health_records')
        .where({ userId: userInfo._id })
        .limit(1)
        .get();

      if (result.data && result.data.length > 0) {
        const record = result.data[0];
        this.setData({
          form: {
            ...this.data.form,
            xingming: record.xingming || '',
            nianling: record.nianling ? String(record.nianling) : '',
            xuexing: record.xuexing || '',
            shengao: record.shengao ? String(record.shengao) : '',
            jiazu_gaoxueya: record.jiazu_gaoxueya || '无',
            jiazu_tangniaobing: record.jiazu_tangniaobing || '无',
            jiazu_xinzang: record.jiazu_xinzang || '无',
            jiazu_qita: record.jiazu_qita || '',
            jinji_lianxiren: record.jinji_lianxiren || '',
            jinji_dianhua: record.jinji_dianhua || '',
            jinji_yibao: record.jinji_yibao || '职工医保',
            jinjicheng_duixiang: record.jinjicheng_duixiang || '无'
          }
        });
      }

      this.setData({ loading: false });
    } catch (err) {
      console.error('加载用户数据失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
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

      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
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