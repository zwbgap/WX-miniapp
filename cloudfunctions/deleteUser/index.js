const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { userId } = event;

  try {
    if (!userId) {
      return { code: -1, message: '用户ID不能为空' };
    }

    const db = cloud.database();

    // 删除用户相关数据
    const relatedCollections = [
      { name: 'health_records', field: 'userId' },
      { name: 'sleep_records', field: 'userId' },
      { name: 'vaccines', field: 'userId' },
      { name: 'medications', field: 'userId' },
      { name: 'news_favorites', field: 'userId' },
      { name: 'ai_conversations', field: 'userId' },
      { name: 'physical_exam', field: 'userId' }
    ];

    for (const { name, field } of relatedCollections) {
      try {
        const records = await db.collection(name).where({ [field]: userId }).get();
        for (const record of records.data) {
          await db.collection(name).doc(record._id).remove();
        }
        console.log(`删除用户 ${userId} 的 ${name} 数据成功`);
      } catch (err) {
        console.log(`删除用户 ${userId} 的 ${name} 数据失败:`, err.message);
      }
    }

    // 解除用户与医生的绑定
    await db.collection('users').where({ doctorId: userId }).update({
      data: { doctorId: null }
    });

    // 删除用户本身
    const result = await db.collection('users').doc(userId).remove();

    if (result.stats.removed > 0) {
      return { code: 0, message: '删除成功' };
    } else {
      return { code: -1, message: '删除失败，用户不存在' };
    }
  } catch (err) {
    console.error('删除用户失败:', err);
    return { code: -1, message: '删除失败', error: err.message };
  }
};