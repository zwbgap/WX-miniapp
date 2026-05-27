const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { newsId } = event;

  try {
    if (!newsId) {
      return { code: -1, message: '参数错误' };
    }

    const db = cloud.database();
    const _ = db.command;

    const result = await db.collection('health_news').doc(newsId).update({
      data: { views: _.inc(1) }
    });

    return { code: 0, message: '更新成功' };
  } catch (err) {
    console.error('更新阅读数失败:', err);
    return { code: -1, message: '更新失败', error: err.message };
  }
};