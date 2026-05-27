Page({
  data: {
    mode: 'create',
    recordId: '',
    loading: true,

    name: '',
    date: '',
    location: '',
    advanceDays: 1,
    doneDate: '',
    note: '',
    status: '待接种',

    datePickerVisible: false,
    datePickerType: 'remind',
    currentDate: Date.now(),
    minDate: Date.now()
  },

  onLoad(options) {
    var mode = options.mode || 'create';
    var id = options.id || '';
    this.setData({ mode: mode, recordId: id });

    if (mode === 'update' && id && id !== 'undefined') {
      this.loadRecord(id);
    } else if (mode === 'create') {
      this.setData({ loading: false });
    } else {
      this.setData({ loading: false });
    }
  },

  async loadRecord(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const db = wx.cloud.database();
      const res = await db.collection('vaccines').doc(id).get();
      wx.hideLoading();

      if (res && res.data) {
        var d = res.data;
        this.setData({
          name: d.yimiaomingcheng || d.name || '',
          date: d.tixingshijian || d.dueDate || '',
          location: d.jiezhongdidian || d.location || '',
          advanceDays: d.advanceDays || 1,
          doneDate: d.jiezhongshijian || '',
          note: d.beizhu || d.notes || '',
          status: d.zhuangtai || d.status || '待接种',
          loading: false
        });
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: '记录不存在', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showModal({
        title: '加载失败',
        content: err.message || '请检查网络和数据库权限',
        showCancel: false
      });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail });
  },

  onAdvanceChange(e) {
    this.setData({ advanceDays: e.detail });
  },

  onOpenDatePicker(e) {
    var type = e.currentTarget.dataset.type || 'remind';
    var dateStr = type === 'remind' ? this.data.date : this.data.doneDate;
    var pickerDate = this.data.currentDate;
    if (dateStr) {
      var parts = dateStr.split('-');
      if (parts.length === 3) {
        pickerDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
      }
    }
    this.setData({
      datePickerVisible: true,
      datePickerType: type,
      currentDate: pickerDate
    });
  },

  onDateConfirm(e) {
    var d = new Date(e.detail);
    var dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');

    if (this.data.datePickerType === 'remind') {
      this.setData({ date: dateStr, datePickerVisible: false });
    } else {
      this.setData({ doneDate: dateStr, datePickerVisible: false });
    }
  },

  onDateCancel() {
    this.setData({ datePickerVisible: false });
  },

  async onSubmit() {
    var name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请输入疫苗名称', icon: 'none' });
      return;
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择提醒时间', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    try {
      var userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        wx.hideLoading();
        wx.showToast({ title: '请先登录', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      var db = wx.cloud.database();
      var data = {
        userId: userInfo._id,
        yimiaomingcheng: name,
        tixingshijian: this.data.date,
        jiezhongdidian: this.data.location.trim(),
        advanceDays: this.data.advanceDays || 1,
        jiezhongshijian: this.data.doneDate,
        beizhu: this.data.note.trim(),
        zhuangtai: this.data.doneDate ? '已接种' : '待接种',
        updatedAt: db.serverDate()
      };

      if (this.data.mode === 'update') {
        await db.collection('vaccines').doc(this.data.recordId).update({ data: data });
      } else {
        data.createTime = db.serverDate();
        data.zhuangtai = '待接种';
        await db.collection('vaccines').add({ data: data });
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
