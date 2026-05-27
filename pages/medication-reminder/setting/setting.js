Page({
  data: {
    mode: 'create',
    recordId: '',
    loading: false,
    submitting: false,

    form: {
      name: '',
      dosage: '',
      frequency: 'daily',
      times: [],
      startDate: '',
      endDate: '',
      notes: ''
    },

    datePickerVisible: false,
    datePickerType: '',
    timePickerVisible: false,
    timePickerValue: '08:00',
    currentPickerDate: Date.now(),

    frequencyOptions: [
      { text: '每天', value: 'daily' },
      { text: '每周', value: 'weekly' }
    ]
  },

  onLoad(options) {
    var mode = options.mode || 'create';
    var id = options.id || '';
    this.setData({ mode: mode, recordId: id });

    if (mode === 'update' && id) {
      this.loadRecord(id);
    } else {
      this.initDefaultDate();
    }
  },

  initDefaultDate() {
    var d = new Date();
    var dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');

    var end = new Date(d.getTime() + 30 * 24 * 3600000);
    var endStr = end.getFullYear() + '-' +
      String(end.getMonth() + 1).padStart(2, '0') + '-' +
      String(end.getDate()).padStart(2, '0');

    var newForm = {};
    var keys = Object.keys(this.data.form);
    for (var k = 0; k < keys.length; k++) {
      newForm[keys[k]] = this.data.form[keys[k]];
    }
    newForm.startDate = dateStr;
    newForm.endDate = endStr;
    this.setData({ form: newForm });
  },

  async loadRecord(id) {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const result = await db.collection('medications').doc(id).get();

      if (result.data) {
        var data = result.data;
        this.setData({
          form: {
            name: data.name || '',
            dosage: data.dosage || '',
            frequency: data.frequency || 'daily',
            times: this.cleanTimes(data.times),
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            notes: data.notes || ''
          },
          loading: false
        });
      }
    } catch (err) {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  cleanTimes: function(times) {
    if (!times || !Array.isArray(times)) return [];
    return times.filter(function(t) {
      if (typeof t !== 'string') return false;
      if (t.indexOf('NaN') !== -1) return false;
      if (t === 'Invalid Date') return false;
      return /^\d{2}:\d{2}$/.test(t);
    });
  },

  onFieldChange(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail;
    var newForm = {};
    var keys = Object.keys(this.data.form);
    for (var k = 0; k < keys.length; k++) {
      newForm[keys[k]] = this.data.form[keys[k]];
    }
    newForm[field] = value;
    this.setData({ form: newForm });
  },

  onFrequencyChange(e) {
    var newForm = {};
    var keys = Object.keys(this.data.form);
    for (var k = 0; k < keys.length; k++) {
      newForm[keys[k]] = this.data.form[keys[k]];
    }
    newForm.frequency = e.detail;
    this.setData({ form: newForm });
  },

  showTimePicker() {
    if (this.data.form.times.length >= 3) {
      wx.showToast({ title: '最多添加3个时间，可长按删除已有时间', icon: 'none', duration: 2000 });
      return;
    }
    this.setData({ timePickerVisible: true });
  },

  onTimeConfirm(e) {
    var hm = '08:00';
    var val = e.detail;

    if (typeof val === 'string' && val.indexOf(':') !== -1) {
      hm = val;
    } else {
      var d = new Date(val);
      var h = d.getHours();
      var m = d.getMinutes();
      if (!isNaN(h) && !isNaN(m)) {
        hm = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      }
    }

    var newTimes = [];
    var oldList = this.data.form.times || [];
    for (var i = 0; i < oldList.length; i++) {
      newTimes.push(oldList[i]);
    }
    if (newTimes.indexOf(hm) === -1) {
      newTimes.push(hm);
      newTimes.sort();
    }

    var newForm = {};
    var keys = Object.keys(this.data.form);
    for (var k = 0; k < keys.length; k++) {
      newForm[keys[k]] = this.data.form[keys[k]];
    }
    newForm.times = newTimes;

    this.setData({ form: newForm, timePickerVisible: false });
  },

  onRemoveTime(e) {
    var index = e.currentTarget.dataset.index;
    var newTimes = [];
    var oldList = this.data.form.times || [];
    for (var i = 0; i < oldList.length; i++) {
      if (i !== index) {
        newTimes.push(oldList[i]);
      }
    }
    var newForm = {};
    var keys = Object.keys(this.data.form);
    for (var k = 0; k < keys.length; k++) {
      newForm[keys[k]] = this.data.form[keys[k]];
    }
    newForm.times = newTimes;
    this.setData({ form: newForm });
  },

  onCancelTimePicker() {
    this.setData({ timePickerVisible: false });
  },

  onOpenDatePicker(e) {
    var type = e.currentTarget.dataset.type;
    var dateStr = type === 'start'
      ? this.data.form.startDate
      : this.data.form.endDate;

    var pickerDate = Date.now();
    if (dateStr) {
      var parts = dateStr.split('-');
      pickerDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
    }

    this.setData({
      datePickerVisible: true,
      datePickerType: type,
      currentPickerDate: pickerDate
    });
  },

  onDateConfirm(e) {
    var d = new Date(e.detail);
    var dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');

    var newForm = {};
    var keys = Object.keys(this.data.form);
    for (var k = 0; k < keys.length; k++) {
      newForm[keys[k]] = this.data.form[keys[k]];
    }
    if (this.data.datePickerType === 'start') {
      newForm.startDate = dateStr;
    } else {
      newForm.endDate = dateStr;
    }
    this.setData({ form: newForm, datePickerVisible: false });
  },

  onDateCancel() {
    this.setData({ datePickerVisible: false });
  },

  validateForm() {
    var f = this.data.form;
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' });
      return false;
    }
    if (f.times.length === 0) {
      wx.showToast({ title: '请添加至少一个用药时间', icon: 'none' });
      return false;
    }
    if (!f.dosage.trim()) {
      wx.showToast({ title: '请输入用药剂量', icon: 'none' });
      return false;
    }
    if (!f.startDate) {
      wx.showToast({ title: '请选择开始日期', icon: 'none' });
      return false;
    }
    if (!f.endDate) {
      wx.showToast({ title: '请选择结束日期', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;
    this.setData({ submitting: true });

    var f = {
      name: this.data.form.name || '',
      dosage: this.data.form.dosage || '',
      frequency: this.data.form.frequency || 'daily',
      times: this.cleanTimes(this.data.form.times),
      startDate: this.data.form.startDate || '',
      endDate: this.data.form.endDate || '',
      notes: this.data.form.notes || ''
    };

    console.log('[med] 保存数据:', JSON.stringify(f));

    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      if (this.data.mode === 'update') {
        console.log('[med] 更新记录:', this.data.recordId);
        var updateRes = await wx.cloud.callFunction({
          name: 'updateMedication',
          data: {
            id: this.data.recordId,
            name: f.name.trim(),
            dosage: f.dosage.trim(),
            frequency: f.frequency,
            times: f.times,
            startDate: f.startDate,
            endDate: f.endDate,
            notes: f.notes.trim()
          }
        });
        console.log('[med] 更新结果:', JSON.stringify(updateRes.result));
        if (updateRes.result.code !== 0) {
          throw new Error(updateRes.result.message || '更新失败');
        }
      } else {
        console.log('[med] 新建记录');
        var addRes = await wx.cloud.callFunction({
          name: 'addMedication',
          data: {
            userId: userInfo._id,
            name: f.name.trim(),
            dosage: f.dosage.trim(),
            frequency: f.frequency,
            times: f.times,
            startDate: f.startDate,
            endDate: f.endDate,
            notes: f.notes.trim()
          }
        });
        console.log('[med] 新建结果:', JSON.stringify(addRes.result));
      }

      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 1000);
    } catch (err) {
      console.error('[med] 保存失败:', err);
      wx.showToast({ title: '保存失败: ' + (err.message || ''), icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});