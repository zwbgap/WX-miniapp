const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { userId } = event;

  if (!userId) {
    return { code: -1, message: '用户ID不能为空' };
  }

  const db = cloud.database();
  try {
    const result = await db.collection('users').doc(userId).get();
    const { password, ...userInfo } = result.data;
    return { code: 0, data: userInfo };
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};