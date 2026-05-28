const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  try {
    const result = await db.collection('users')
      .where({ identity: 'doctor' })
      .orderBy('createdAt', 'desc')
      .get();

    const doctors = result.data.map(doc => {
      const { password, ...info } = doc;
      return info;
    });

    return { code: 0, data: doctors };
  } catch (err) {
    console.error('获取医生列表失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};