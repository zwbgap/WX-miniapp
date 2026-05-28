const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  try {
    const db = cloud.database();

    const collections = [
      'users',
      'health_records',
      'sleep_records',
      'vaccines',
      'medications',
      'doctor_invites',
      'health_news',
      'news_favorites',
      'physical_exam',
      'ai_conversations'
    ];

    for (const collectionName of collections) {
      try {
        const countResult = await db.collection(collectionName).count();
        console.log(`清除集合 ${collectionName}, 共有 ${countResult.total} 条记录`);
        
        if (countResult.total > 0) {
          const allIds = await db.collection(collectionName).field({ _id: true }).get();
          for (const item of allIds.data) {
            await db.collection(collectionName).doc(item._id).remove();
          }
          console.log(`成功清除集合 ${collectionName}`);
        }
      } catch (err) {
        console.log(`清除集合 ${collectionName} 失败:`, err.message);
      }
    }

    return {
      code: 0,
      message: '所有数据已清除'
    };
  } catch (err) {
    console.error('清除数据失败:', err);
    return { code: -1, message: '清除失败', error: err.message };
  }
};