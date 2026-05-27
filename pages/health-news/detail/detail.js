Page({
  data: {
    newsId: '',
    loading: true,
    news: null,
    isFavorited: false,
    favoriting: false
  },

  onLoad: function(options) {
    console.log('[detail] onLoad options:', options);
    if (options.id) {
      this.setData({ newsId: options.id });
      this.loadDetail();
      this.checkFavorite();
    }
  },

  onShow: function() {
    console.log('[detail] onShow');
    this.checkFavorite();
  },

  onShareAppMessage: function() {
    return {
      title: this.data.news ? this.data.news.title : '健康资讯',
      path: '/pages/health-news/detail/detail?id=' + this.data.newsId
    };
  },

  loadDetail: async function() {
    console.log('[detail] loadDetail 开始');
    this.setData({ loading: true });
    try {
      var db = wx.cloud.database();
      var result = await db.collection('health_news').doc(this.data.newsId).get();
      console.log('[detail] loadDetail 结果:', result);

      if (result.data) {
        var newsData = result.data;
        this.setData({ news: newsData, loading: false });
        this.addViewCount();
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: '文章不存在', icon: 'none' });
      }
    } catch (err) {
      console.error('[detail] 加载失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  addViewCount: async function() {
    try {
      await wx.cloud.callFunction({
        name: 'updateNewsView',
        data: { newsId: this.data.newsId }
      });
    } catch (err) {
      console.error('[detail] 更新阅读数失败:', err);
    }
  },

  checkFavorite: async function() {
    console.log('[detail] checkFavorite 开始');
    try {
      var app = getApp();
      var userId = app.globalData.userInfo ? app.globalData.userInfo._id : '';
      console.log('[detail] checkFavorite userId:', userId);
      if (!userId) {
        this.setData({ isFavorited: false });
        return;
      }

      console.log('[detail] 调用 newsFavorite 云函数检查收藏');
      var result = await wx.cloud.callFunction({
        name: 'newsFavorite',
        data: { userId, newsId: this.data.newsId, action: 'check' }
      });
      console.log('[detail] checkFavorite result:', result);

      if (result.result && result.result.code === 0) {
        this.setData({ isFavorited: result.result.data.isFavorited });
      }
    } catch (err) {
      console.error('[detail] 检查收藏失败:', err);
    }
  },

  onToggleFavorite: async function() {
    console.log('[detail] onToggleFavorite 开始');
    if (this.data.favoriting) return;
    this.setData({ favoriting: true });

    var news = this.data.news;
    console.log('[detail] news:', news);
    if (!news) {
      console.log('[detail] news 为空');
      this.setData({ favoriting: false });
      return;
    }

    var app = getApp();
    var userId = app.globalData.userInfo ? app.globalData.userInfo._id : '';
    console.log('[detail] userId:', userId);

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ favoriting: false });
      return;
    }

    try {
      var action = this.data.isFavorited ? 'remove' : 'add';
      console.log('[detail] 执行收藏操作 action:', action);

      var result = await wx.cloud.callFunction({
        name: 'newsFavorite',
        data: {
          userId,
          newsId: news._id,
          action,
          newsData: { title: news.title, category: news.category, picture: news.picture }
        }
      });

      console.log('[detail] 收藏操作结果:', result);

      if (result.result && result.result.code === 0) {
        this.setData({ isFavorited: !this.data.isFavorited });
        wx.showToast({
          title: this.data.isFavorited ? '已收藏' : '已取消收藏',
          icon: this.data.isFavorited ? 'success' : 'none'
        });
      } else {
        console.log('[detail] 收藏操作失败:', result.result);
        wx.showToast({ title: result.result?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      console.error('[detail] 收藏操作失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }

    this.setData({ favoriting: false });
  },

  onShare: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
});