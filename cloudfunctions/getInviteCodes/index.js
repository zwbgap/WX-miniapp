const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { pageSize = 20, pageIndex = 1 } = event;

  try {
    const db = cloud.database();
    const countResult = await db.collection('doctor_invites').count();

    const result = await db.collection('doctor_invites')
      .orderBy('createdAt', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      code: 0,
      message: '获取成功',
      data: {
        list: result.data,
        total: countResult.total,
        pageSize,
        pageIndex
      }
    };
  } catch (err) {
    console.error('获取邀请码列表失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};