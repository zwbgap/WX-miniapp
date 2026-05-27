Page({
  data: {
    activeTab: 0,
    keyword: '',
    newsList: [],
    loading: false,

    categories: [
      { title: '全部', value: '' },
      { title: '营养饮食', value: '营养饮食' },
      { title: '运动健身', value: '运动健身' },
      { title: '心理健康', value: '心理健康' },
      { title: '疾病预防', value: '疾病预防' },
      { title: '睡眠健康', value: '睡眠健康' },
      { title: '中医养生', value: '中医养生' },
      { title: '妇幼保健', value: '妇幼保健' },
      { title: '慢病管理', value: '慢病管理' },
      { title: '体重控制', value: '体重控制' },
      { title: '养生保健', value: '养生保健' }
    ]
  },

  onLoad: function() {
    this.loadNews();
  },

  onPullDownRefresh: function() {
    var that = this;
    this.loadNews().then(function() { wx.stopPullDownRefresh(); });
  },

  onTabChange: function(e) {
    this.setData({ activeTab: e.detail.index });
    this.loadNews();
  },

  loadNews: async function() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      var db = wx.cloud.database();
      var result = await db.collection('health_news').limit(20).get();
      var list = result.data || [];

      list.sort(function(a, b) {
        return (b.publishTime || b.date || '').localeCompare(a.publishTime || a.date || '');
      });

      var category = this.data.categories[this.data.activeTab].value;
      if (category) {
        list = list.filter(function(item) { return item.category === category; });
      }

      this.setData({ newsList: list, loading: false });
    } catch (err) {
      console.error('[list] 加载失败:', err);
      wx.showToast({ title: '加载失败: ' + (err.message || ''), icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onSearch: function(e) {
    this.setData({ keyword: e.detail });
  },

  onViewDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/pages/health-news/detail/detail?id=' + id });
  },

  onGoFavorites: function() {
    wx.navigateTo({ url: '/pages/health-news/favorites/favorites' });
  }
});
