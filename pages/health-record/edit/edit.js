Page({
  data: {
    mode: 'create',
    recordId: '',
    loading: false,
    submitting: false,

    title: '',
    recordDate: '',
    showDatePicker: false,
    form: {
      shengao: '',
      tizhong: '',
      guominshi: '',
      jibingshi: '',
      jiankangzhuangkuang: '',
      xiyan: '无',
      yinjiul: '无',
      yundong: '每周几次',
      yinshi: '规律',
      yongyao_leixing: '',
      yongyao_mingcheng: '',
      yongyao_guomin: ''
    },

    bmi: 0,
    bmiLevel: '',
    bmiColor: ''
  },

  onLoad(options) {
    var mode = options.mode || 'create';
    this.setData({ mode: mode, recordId: options.id || '' });

    // 设置默认日期（今天）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;

    // 创建模式下默认选择今天日期
    if (mode === 'create') {
      this.setData({ 
        recordDate: defaultDate,
        title: `健康档案 ${defaultDate}`
      });
    } else {
      // 更新模式下先设置默认日期，加载后再覆盖
      this.setData({ recordDate: defaultDate });
    }

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
        // 验证日期格式是否有效
        let recordDate = data.recordDate || '';
        if (recordDate) {
          const date = new Date(recordDate);
          if (isNaN(date.getTime())) {
            const now = new Date();
            recordDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          }
        }
        this.setData({
          title: data.title || '',
          recordDate: recordDate,
          form: {
            shengao: data.shengao ? String(data.shengao) : '',
            tizhong: data.tizhong ? String(data.tizhong) : '',
            guominshi: data.guominshi || '',
            jibingshi: data.jibingshi || '',
            jiankangzhuangkuang: data.jiankangzhuangkuang || '',
            xiyan: data.xiyan || '无',
            yinjiul: data.yinjiul || '无',
            yundong: data.yundong || '每周几次',
            yinshi: data.yinshi || '规律',
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

  onTitleChange(e) {
    this.setData({ title: e.detail });
  },

  onOpenDatePicker() {
    this.setData({ showDatePicker: true });
  },

  onDateConfirm(e) {
    const dateStr = e.detail;
    // 验证日期格式是否正确
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      this.setData({ 
        recordDate: dateStr,
        showDatePicker: false,
        title: `健康档案 ${dateStr}`
      });
    } else {
      wx.showToast({ title: '日期格式错误', icon: 'none' });
      this.setData({ showDatePicker: false });
    }
  },

  onDateCancel() {
    this.setData({ showDatePicker: false });
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

  calcBMI() {
    var h = parseFloat(this.data.form.shengao);
    var w = parseFloat(this.data.form.tizhong);
    
    // 检查是否有效
    if (!h || !w || h <= 0 || w <= 0) {
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
    
    // 身高和体重为必填项
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
        title: this.data.title || `健康档案 ${this.data.recordDate || new Date().toISOString().split('T')[0]}`,
        shengao: parseInt(f.shengao) || 0,
        tizhong: parseInt(f.tizhong) || 0,
        guominshi: f.guominshi ? f.guominshi.trim() : '',
        jibingshi: f.jibingshi ? f.jibingshi.trim() : '',
        jiankangzhuangkuang: f.jiankangzhuangkuang ? f.jiankangzhuangkuang.trim() : '',
        xiyan: f.xiyan || '无',
        yinjiul: f.yinjiul || '无',
        yundong: f.yundong || '每周几次',
        yinshi: f.yinshi || '规律',
        yongyao_leixing: f.yongyao_leixing ? f.yongyao_leixing.trim() : '',
        yongyao_mingcheng: f.yongyao_mingcheng ? f.yongyao_mingcheng.trim() : '',
        yongyao_guomin: f.yongyao_guomin ? f.yongyao_guomin.trim() : '',
        recordDate: this.data.recordDate || new Date().toISOString().split('T')[0],
        createdAt: (this.data.recordDate && new Date(this.data.recordDate).getTime()) || new Date().getTime()
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
