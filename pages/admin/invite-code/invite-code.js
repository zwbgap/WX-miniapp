const { ensureAdmin } = require('../../../utils/security');

function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

Page({
  data: {
    account: '',
    count: '',
    loading: false,
    codes: [],
    history: []
  },

  onLoad() {
    if (!ensureAdmin()) return;
    this.loadHistory();
  },

  onShow() {
    ensureAdmin();
    this.loadHistory();
  },

  onAccountInput(e) {
    this.setData({ account: e.detail });
  },

  onCountInput(e) {
    const value = e.detail;
    if (!value || value === '') {
      this.setData({ count: '' });
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num > 0) {
        this.setData({ count: Math.min(num, 10) });
      }
    }
  },

  async loadHistory() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getInviteCodes',
        data: { pageSize: 20 }
      });

      if (result.result.code === 0) {
        const list = result.result.data.list.map(item => ({
          ...item,
          createdAt: formatDate(item.createdAt),
          usedAt: formatDate(item.usedAt)
        }));
        this.setData({ history: list });
      }
    } catch (err) {
      console.error('加载历史邀请码失败:', err);
    }
  },

  async onGenerate() {
    const count = parseInt(this.data.count) || 1;

    if (count < 1 || count > 10) {
      wx.showToast({ title: '数量需在1-10之间', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'generateInviteCodes',
        data: {
          account: this.data.account.trim() || null,
          count: count
        }
      });

      if (result.result.code === 0) {
        wx.showToast({ title: '生成成功', icon: 'success' });
        this.setData({
          codes: result.result.data.codes,
          account: '',
          count: ''
        });
        this.loadHistory();
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' });
      }
    } catch (err) {
      console.error('生成邀请码失败:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCopy(e) {
    const code = e.currentTarget.dataset.code;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  }
});
