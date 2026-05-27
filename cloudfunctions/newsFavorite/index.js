const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { userId, newsId, action, newsData } = event;

  console.log('[newsFavorite] 收到请求:', JSON.stringify(event));

  try {
    if (!userId) {
      console.log('[newsFavorite] userId 缺失');
      return { code: -1, message: '参数错误: userId缺失' };
    }

    if (!newsId && action !== 'list' && action !== 'count') {
      console.log('[newsFavorite] newsId 缺失, action:', action);
      return { code: -1, message: '参数错误: newsId缺失' };
    }

    const db = cloud.database();

    if (action === 'add') {
      console.log('[newsFavorite] 执行添加收藏');
      const exists = await db.collection('news_favorites')
        .where({ userId, newsId })
        .get();

      if (exists.data.length > 0) {
        console.log('[newsFavorite] 已存在');
        return { code: 0, message: '已收藏', data: exists.data[0] };
      }

      const result = await db.collection('news_favorites').add({
        data: {
          userId,
          newsId,
          title: newsData?.title || '',
          category: newsData?.category || '健康',
          picture: newsData?.picture || '',
          createdAt: db.serverDate()
        }
      });

      console.log('[newsFavorite] 添加成功:', result._id);
      return { code: 0, message: '收藏成功', data: { _id: result._id } };

    } else if (action === 'remove') {
      console.log('[newsFavorite] 执行删除收藏, newsId:', newsId);
      await db.collection('news_favorites')
        .where({ userId, newsId })
        .remove();

      return { code: 0, message: '取消收藏成功' };

    } else if (action === 'check') {
      const exists = await db.collection('news_favorites')
        .where({ userId, newsId })
        .get();

      return { code: 0, data: { isFavorited: exists.data.length > 0 } };

    } else if (action === 'list') {
      console.log('[newsFavorite] 查询收藏列表, userId:', userId);
      const result = await db.collection('news_favorites')
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .get();

      console.log('[newsFavorite] 查询结果数量:', result.data.length);
      return { code: 0, data: result.data };

    } else if (action === 'count') {
      const result = await db.collection('news_favorites')
        .where({ userId })
        .count();

      return { code: 0, data: { count: result.total } };
    }

    return { code: -1, message: '无效操作' };
  } catch (err) {
    console.error('收藏操作失败:', err);
    return { code: -1, message: '操作失败', error: err.message };
  }
};