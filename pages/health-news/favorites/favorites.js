Page({
  data: {
    favoriteList: [],
    loading: false
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    this.loadFavorites();
  },

  loadFavorites: async function() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      var app = getApp();
      var userId = app.globalData.userInfo ? app.globalData.userInfo._id : '';
      if (!userId) {
        this.setData({ favoriteList: [], loading: false });
        return;
      }

      console.log('[favorites] 开始加载收藏, userId:', userId);
      var result = await wx.cloud.callFunction({
        name: 'newsFavorite',
        data: { userId, action: 'list' }
      });

      console.log('[favorites] 加载结果:', result);

      if (result.result && result.result.code === 0) {
        this.setData({ favoriteList: result.result.data });
      } else {
        this.setData({ favoriteList: [] });
      }
    } catch (err) {
      console.error('加载收藏失败:', err);
      this.setData({ favoriteList: [] });
    }

    this.setData({ loading: false });
  },

  onViewDetail(e) {
    var newsId = e.currentTarget.dataset.newsid;
    console.log('[favorites] 查看详情 newsId:', newsId);
    if (newsId) {
      wx.navigateTo({ url: '/pages/health-news/detail/detail?id=' + newsId });
    }
  },

  onRemoveFavorite(e) {
    var newsId = e.currentTarget.dataset.newsid;
    var app = getApp();
    var userId = app.globalData.userInfo ? app.globalData.userInfo._id : '';

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这篇资讯吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            var result = await wx.cloud.callFunction({
              name: 'newsFavorite',
              data: { userId, newsId: newsId, action: 'remove' }
            });

            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已取消收藏', icon: 'success' });
              this.loadFavorites();
            } else {
              wx.showToast({ title: '取消失败', icon: 'none' });
            }
          } catch (err) {
            console.error('取消收藏失败:', err);
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  onGoToNews() {
    wx.switchTab({ url: '/pages/health-news/index' });
  }
});