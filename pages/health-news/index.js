const { ensureUser } = require('../../utils/security');

Page({
  data: {
    newsList: [],
    loading: true,
    categories: ['全部', '营养饮食', '运动健身', '心理健康', '疾病预防', '睡眠健康', '中医养生', '妇幼保健', '慢病管理', '体重控制', '养生保健'],
    activeCategory: '全部'
  },

  onLoad: function() {
    if (!ensureUser()) return;
    this.loadNews();
  },

  onShow: function() {
    ensureUser();
  },

  onPullDownRefresh: function() {
    var that = this;
    this.loadNews().then(function() { wx.stopPullDownRefresh(); });
  },

  loadNews: async function() {
    this.setData({ loading: true });
    try {
      var db = wx.cloud.database();
      var result = await db.collection('health_news').limit(20).get();
      var list = result.data || [];
      console.log('[health-news] 从数据库读取到 ' + list.length + ' 条资讯');

      list.sort(function(a, b) {
        return (b.publishTime || b.date || '').localeCompare(a.publishTime || a.date || '');
      });

      if (list.length === 0) {
        console.log('[health-news] 数据库无记录，调用云函数生成');
        var genResult = await wx.cloud.callFunction({ name: 'generateHealthNews' });
        console.log('[health-news] 生成结果:', JSON.stringify(genResult.result));
        result = await db.collection('health_news').limit(20).get();
        list = result.data || [];
        list.sort(function(a, b) {
          return (b.publishTime || b.date || '').localeCompare(a.publishTime || a.date || '');
        });
      }

      console.log('[health-news] 最终展示 ' + list.length + ' 条');
      this.setData({ newsList: list, loading: false });
    } catch (err) {
      console.error('[health-news] 加载失败:', err);
      wx.showToast({ title: '加载失败: ' + (err.message || ''), icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onCategoryTap: function(e) {
    var category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
  },

  onViewDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/health-news/detail/detail?id=' + id });
  },

  onRefreshNews: function() {
    var that = this;
    wx.showLoading({ title: '刷新资讯中...' });
    wx.cloud.callFunction({ name: 'generateHealthNews' }).then(function(res) {
      console.log('[health-news] 刷新结果:', JSON.stringify(res.result));
      wx.hideLoading();
      that.loadNews();
    }).catch(function(err) {
      console.error('[health-news] 刷新失败:', err);
      wx.hideLoading();
      that.loadNews();
    });
  }
});
