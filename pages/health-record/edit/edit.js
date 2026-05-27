Page({
  data: {
    mode: 'create',
    recordId: '',
    loading: false,
    submitting: false,

    form: {
      xingming: '',
      xingbie: '',
      nianling: '',
      shengao: '',
      tizhong: '',
      xuexing: '',
      guominshi: '',
      jibingshi: '',
      jiankangzhuangkuang: '',
      xiyan: '无',
      yinjiul: '无',
      yundong: '每周几次',
      shuimian: '',
      yinshi: '规律',
      jiazu_gaoxueya: '无',
      jiazu_tangniaobing: '无',
      jiazu_xinzang: '无',
      jiazu_qita: '',
      jinji_lianxiren: '',
      jinji_dianhua: '',
      jinji_yibao: '职工医保',
      jinjicheng_duixiang: '无',
      yongyao_leixing: '',
      yongyao_mingcheng: '',
      yongyao_guomin: ''
    },

    bloodTypeColumns: ['A型', 'B型', 'AB型', 'O型'],
    pickerVisible: false,
    pickerType: '',
    pickerValue: 0,

    bmi: 0,
    bmiLevel: '',
    bmiColor: ''
  },

  onLoad(options) {
    var mode = options.mode || 'create';
    this.setData({ mode: mode, recordId: options.id || '' });

    if (mode === 'update' && options.id) {
      this.loadRecord(options.id);
    }
  },

  async loadRecord(id) {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const result = await db.collection('health_records').doc(id).get();

      if (result.data) {
        const data = result.data;
        this.setData({
          form: {
            xingming: data.xingming || '',
            xingbie: data.xingbie || '',
            nianling: data.nianling ? String(data.nianling) : '',
            shengao: data.shengao ? String(data.shengao) : '',
            tizhong: data.tizhong ? String(data.tizhong) : '',
            xuexing: data.xuexing || '',
            guominshi: data.guominshi || '',
            jibingshi: data.jibingshi || '',
            jiankangzhuangkuang: data.jiankangzhuangkuang || '',
            xiyan: data.xiyan || '无',
            yinjiul: data.yinjiul || '无',
            yundong: data.yundong || '每周几次',
            shuimian: data.shuimian ? String(data.shuimian) : '',
            yinshi: data.yinshi || '规律',
            jiazu_gaoxueya: data.jiazu_gaoxueya || '无',
            jiazu_tangniaobing: data.jiazu_tangniaobing || '无',
            jiazu_xinzang: data.jiazu_xinzang || '无',
            jiazu_qita: data.jiazu_qita || '',
            jinji_lianxiren: data.jinji_lianxiren || '',
            jinji_dianhua: data.jinji_dianhua || '',
            jinji_yibao: data.jinji_yibao || '职工医保',
            jinjicheng_duixiang: data.jinjicheng_duixiang || '无',
            yongyao_leixing: data.yongyao_leixing || '',
            yongyao_mingcheng: data.yongyao_mingcheng || '',
            yongyao_guomin: data.yongyao_guomin || ''
          },
          loading: false
        });
        this.calcBMI();
      }
    } catch (err) {
      console.error('加载档案失败:', err);
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

    if (field === 'shengao' || field === 'tizhong') {
      this.calcBMI();
    }
  },

  onRadioChange(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail;
    var form = this.data.form;
    form[field] = value;
    this.setData({ form: form });
  },

  onGenderChange(e) {
    var form = this.data.form;
    form.xingbie = e.detail;
    this.setData({ form: form });
  },

  onHeightSliderChange(e) {
    var form = this.data.form;
    form.shengao = String(e.detail.value);
    this.setData({ form: form });
    this.calcBMI();
  },

  onWeightSliderChange(e) {
    var form = this.data.form;
    form.tizhong = String(e.detail.value);
    this.setData({ form: form });
    this.calcBMI();
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

  calcBMI() {
    var h = parseFloat(this.data.form.shengao);
    var w = parseFloat(this.data.form.tizhong);
    if (!h || !w || h <= 0) {
      this.setData({ bmi: 0, bmiLevel: '', bmiColor: '' });
      return;
    }

    h = h / 100;
    var bmi = w / (h * h);
    var level = '';
    var color = '';

    if (bmi < 18.5) { level = '偏瘦'; color = '#ff976a'; }
    else if (bmi < 24) { level = '正常'; color = '#07c160'; }
    else if (bmi < 28) { level = '偏胖'; color = '#ff976a'; }
    else { level = '肥胖'; color = '#ee0a24'; }

    this.setData({
      bmi: bmi.toFixed(1),
      bmiLevel: level,
      bmiColor: color
    });
  },

  validateForm() {
    var f = this.data.form;
    if (!f.xingming.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!f.xingbie) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return false;
    }
    if (!f.nianling || parseInt(f.nianling) <= 0) {
      wx.showToast({ title: '请输入有效年龄', icon: 'none' });
      return false;
    }
    if (!f.shengao || parseInt(f.shengao) < 50 || parseInt(f.shengao) > 250) {
      wx.showToast({ title: '请输入有效身高(50-250cm)', icon: 'none' });
      return false;
    }
    if (!f.tizhong || parseInt(f.tizhong) < 10 || parseInt(f.tizhong) > 300) {
      wx.showToast({ title: '请输入有效体重(10-300kg)', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;

    var f = this.data.form;

    this.setData({ submitting: true });

    try {
      const db = wx.cloud.database();
      const userInfo = wx.getStorageSync('userInfo');

      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      var data = {
        userId: userInfo._id,
        xingming: f.xingming.trim(),
        xingbie: f.xingbie,
        nianling: parseInt(f.nianling) || 0,
        shengao: parseInt(f.shengao) || 0,
        tizhong: parseInt(f.tizhong) || 0,
        xuexing: f.xuexing || '',
        guominshi: f.guominshi ? f.guominshi.trim() : '',
        jibingshi: f.jibingshi ? f.jibingshi.trim() : '',
        jiankangzhuangkuang: f.jiankangzhuangkuang ? f.jiankangzhuangkuang.trim() : '',
        xiyan: f.xiyan || '无',
        yinjiul: f.yinjiul || '无',
        yundong: f.yundong || '每周几次',
        shuimian: f.shuimian ? parseFloat(f.shuimian) : 0,
        yinshi: f.yinshi || '规律',
        jiazu_gaoxueya: f.jiazu_gaoxueya || '无',
        jiazu_tangniaobing: f.jiazu_tangniaobing || '无',
        jiazu_xinzang: f.jiazu_xinzang || '无',
        jiazu_qita: f.jiazu_qita ? f.jiazu_qita.trim() : '',
        jinji_lianxiren: f.jinji_lianxiren ? f.jinji_lianxiren.trim() : '',
        jinji_dianhua: f.jinji_dianhua ? f.jinji_dianhua.trim() : '',
        jinji_yibao: f.jinji_yibao || '职工医保',
        jinjicheng_duixiang: f.jinjicheng_duixiang || '无',
        yongyao_leixing: f.yongyao_leixing ? f.yongyao_leixing.trim() : '',
        yongyao_mingcheng: f.yongyao_mingcheng ? f.yongyao_mingcheng.trim() : '',
        yongyao_guomin: f.yongyao_guomin ? f.yongyao_guomin.trim() : '',
        recordDate: new Date().toISOString().split('T')[0]
      };

      if (this.data.mode === 'update') {
        await db.collection('health_records').doc(this.data.recordId).update({
          data: { ...data, updatedAt: db.serverDate() }
        });
      } else {
        await db.collection('health_records').add({ data });
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