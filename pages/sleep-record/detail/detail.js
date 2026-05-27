Page({
  data: {
    mode: 'create',
    recordId: '',
    loading: false,
    submitting: false,

    record: {
      jiluriqi: '',
      rushuishijian: '',
      qichuangshijian: '',
      shuimianshizhang: 0,
      shuimianzhiliang: 3,
      jiluneirong: ''
    },

    sleepTimePickerVisible: false,
    wakeTimePickerVisible: false,
    datePickerVisible: false,

    currentSleepTime: '22:00',
    currentWakeTime: '06:00',
    currentDate: Date.now(),
    minDate: new Date('2020-01-01').getTime(),

    durationAutoCalc: false
  },

  onLoad(options) {
    const mode = options.mode || 'create';
    const id = options.id || '';

    this.setData({
      mode: mode,
      recordId: id,
      currentSleepTime: '22:00',
      currentWakeTime: '06:00',
      currentDate: Date.now()
    });

    if (mode === 'update' && id) {
      this.loadRecord(id);
    } else {
      this.setDefaultDate();
    }
  },

  setDefaultDate() {
    const d = new Date();
    const dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    const r = this.data.record;
    r.jiluriqi = dateStr;
    this.setData({ record: r });
  },

  async loadRecord(id) {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const result = await db.collection('sleep_records').doc(id).get();

      if (result.data) {
        const item = result.data;

        const sleepTimeStr = item.rushuishijian || item.sleepTime || '';
        const wakeTimeStr = item.qichuangshijian || item.wakeTime || '';

        const sleepParts = sleepTimeStr.split('T')[1]?.split(':') || [];
        const wakeParts = wakeTimeStr.split('T')[1]?.split(':') || [];

        const sleepHour = String(parseInt(sleepParts[0]) || 22).padStart(2, '0');
        const sleepMin = String(parseInt(sleepParts[1]) || 0).padStart(2, '0');
        const wakeHour = String(parseInt(wakeParts[0]) || 6).padStart(2, '0');
        const wakeMin = String(parseInt(wakeParts[1]) || 0).padStart(2, '0');

        this.setData({
          record: {
            jiluriqi: item.jiluriqi || item.recordDate || '',
            rushuishijian: item.rushuishijian || sleepTimeStr,
            qichuangshijian: item.qichuangshijian || wakeTimeStr,
            shuimianshizhang: item.shuimianshizhang || item.duration || 0,
            shuimianzhiliang: item.shuimianzhiliang || item.quality || 3,
            jiluneirong: item.jiluneirong || item.note || ''
          },
          currentSleepTime: sleepHour + ':' + sleepMin,
          currentWakeTime: wakeHour + ':' + wakeMin,
          loading: false
        });

        if (item.jiluriqi || item.recordDate) {
          const dateStr = item.jiluriqi || item.recordDate;
          const parts = dateStr.split('-');
          if (parts.length >= 3) {
            this.setData({
              currentDate: new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime()
            });
          }
        }
      }
    } catch (err) {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onShowSleepPicker() {
    this.setData({ sleepTimePickerVisible: true });
  },

  onShowWakePicker() {
    this.setData({ wakeTimePickerVisible: true });
  },

  onShowDatePicker() {
    this.setData({ datePickerVisible: true });
  },

  onSleepTimeConfirm(e) {
    const timeStr = e.detail;
    const r = this.data.record;
    r.rushuishijian = this.data.record.jiluriqi + 'T' + timeStr + ':00';
    this.setData({
      record: r,
      currentSleepTime: timeStr,
      sleepTimePickerVisible: false
    });
    this.calcDuration();
  },

  onWakeTimeConfirm(e) {
    const timeStr = e.detail;
    const r = this.data.record;
    r.qichuangshijian = this.data.record.jiluriqi + 'T' + timeStr + ':00';
    this.setData({
      record: r,
      currentWakeTime: timeStr,
      wakeTimePickerVisible: false
    });
    this.calcDuration();
  },

  onDateConfirm(e) {
    const d = new Date(e.detail);
    const dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    const r = this.data.record;
    r.jiluriqi = dateStr;

    if (r.rushuishijian) {
      r.rushuishijian = dateStr + 'T' + r.rushuishijian.split('T')[1];
    }
    if (r.qichuangshijian) {
      r.qichuangshijian = dateStr + 'T' + r.qichuangshijian.split('T')[1];
    }

    this.setData({ record: r, currentDate: e.detail, datePickerVisible: false });
  },

  onCancelPicker() {
    this.setData({
      sleepTimePickerVisible: false,
      wakeTimePickerVisible: false,
      datePickerVisible: false
    });
  },

  calcDuration() {
    const r = this.data.record;
    if (!r.rushuishijian || !r.qichuangshijian) return;

    const sleepParts = r.rushuishijian.split('T')[1]?.split(':') || [];
    const wakeParts = r.qichuangshijian.split('T')[1]?.split(':') || [];

    let sleepMin = parseInt(sleepParts[0]) * 60 + parseInt(sleepParts[1]);
    let wakeMin = parseInt(wakeParts[0]) * 60 + parseInt(wakeParts[1]);

    if (wakeMin <= sleepMin) wakeMin += 24 * 60;

    const totalMin = wakeMin - sleepMin;
    r.shuimianshizhang = totalMin;
    this.setData({ record: r, durationAutoCalc: true });
  },

  onQualityChange(e) {
    const r = this.data.record;
    r.shuimianzhiliang = e.detail;
    this.setData({ record: r });
  },

  onNoteInput(e) {
    const r = this.data.record;
    r.jiluneirong = e.detail || '';
    this.setData({ record: r });
  },

  validateForm() {
    const r = this.data.record;
    if (!r.jiluriqi) {
      wx.showToast({ title: '请选择记录日期', icon: 'none' });
      return false;
    }
    if (!r.rushuishijian) {
      wx.showToast({ title: '请选择入睡时间', icon: 'none' });
      return false;
    }
    if (!r.qichuangshijian) {
      wx.showToast({ title: '请选择起床时间', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;

    this.setData({ submitting: true });

    try {
      const db = wx.cloud.database();
      const userInfo = wx.getStorageSync('userInfo');
      const record = {
        ...this.data.record,
        userId: userInfo._id,
        shuimianshizhang: parseInt(this.data.record.shuimianshizhang) || 0,
        shuimianzhiliang: parseInt(this.data.record.shuimianzhiliang) || 3,
        updateTime: db.serverDate()
      };

      if (this.data.mode === 'create') {
        record.createTime = db.serverDate();
      }

      let res;
      if (this.data.mode === 'create') {
        res = await db.collection('sleep_records').add({ data: record });
      } else {
        res = await db.collection('sleep_records').doc(this.data.recordId).update({ data: record });
      }

      this.setData({ submitting: false });
      
      wx.setStorageSync('sleepRecordNeedRefresh', true);
      
      wx.showToast({
        title: this.data.mode === 'create' ? '添加成功' : '更新成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存失败:', err);
      this.setData({ submitting: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
