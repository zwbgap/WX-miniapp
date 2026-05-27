const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { userId, ...updateData } = event;

  try {
    if (!userId) {
      return { code: -1, message: '用户ID不能为空' };
    }

    const db = cloud.database();
    await db.collection('users').doc(userId).update({
      data: {
        ...updateData,
        updatedAt: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '更新成功'
    };
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return { code: -1, message: '更新失败', error: err.message };
  }
};