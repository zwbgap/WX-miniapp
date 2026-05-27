Page({
  data: {
    loading: true,
    calendarVisible: false,
    currentDate: Date.now(),
    minDate: Date.now() - 90 * 24 * 3600000,
    maxDate: Date.now() + 365 * 24 * 3600000,

    formatter: function(day) {
      return day;
    },

    allRecords: [],
    selectedDayRecords: [],
    selectedDateText: '',
    todayRecords: [],

    markedDates: []
  },

  onLoad() {
    this.setToday();
    this.loadAllRecords();
  },

  setToday() {
    var d = new Date();
    var dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    this.setData({ selectedDateText: dateStr });
  },

  async loadAllRecords() {
    this.setData({ loading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo._id) {
        this.setData({ loading: false });
        return;
      }

      const result = await wx.cloud.callFunction({
        name: 'getVaccines',
        data: { userId: userInfo._id }
      });

      if (result.result.code === 0) {
        var records = result.result.data || [];

        var today = this.data.selectedDateText;
        var todayList = records.filter(function(item) {
          return item.dueDate === today;
        });

        var markedDates = records.map(function(item) {
          var dateStr = item.dueDate || '';
          return {
            date: dateStr,
            type: item.status === 'completed' ? 'success' : 'warning'
          };
        });

        this.setData({
          allRecords: records,
          todayRecords: todayList,
          markedDates: markedDates,
          loading: false
        });

        this.updateCalendarFormatter();
      }
    } catch (err) {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
    }
  },

  updateCalendarFormatter() {
    var marked = this.data.markedDates;
    var that = this;

    this.setData({
      formatter: function(day) {
        var d = new Date(day.year, day.month - 1, day.date);
        var dateStr = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(day.date).padStart(2, '0');

        var found = marked.find(function(m) { return m.date === dateStr; });
        if (found) {
          if (found.type === 'success') {
            day.type = 'selected';
            day.bottomInfo = '已接种';
          } else {
            day.type = 'multiple';
            day.bottomInfo = '提醒';
          }
        }
        return day;
      }
    });
  },

  onShowCalendar() {
    this.setData({ calendarVisible: true });
  },

  onCalendarClose() {
    this.setData({ calendarVisible: false });
  },

  onSelectDay(e) {
    var detail = e.detail;
    var d = new Date(detail.year, detail.month - 1, detail.date);
    var dateStr = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(detail.date).padStart(2, '0');

    var dayRecords = this.data.allRecords.filter(function(item) {
      return item.dueDate === dateStr;
    });

    this.setData({
      selectedDateText: dateStr,
      selectedDayRecords: dayRecords,
      calendarVisible: false
    });
  },

  onMonthShow(e) {
    var detail = e.detail;
    var d = new Date(detail.year, detail.month - 1, 1);
    var monthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    console.log('切换月份:', monthStr);
  },

  onViewDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/vaccine-reminder/detail/detail?id=' + id });
  },

  getStatusTag(status) {
    if (status === '已接种' || status === 'completed') return { type: 'success', text: '已接种' };
    return { type: 'warning', text: '待接种' };
  }
});