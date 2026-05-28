const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  try {
    const db = cloud.database();
    const result = await db.collection('users').where({ identity: 'doctor' }).count();

    return { code: 0, data: { count: result.total } };
  } catch (err) {
    console.error('统计医生数量失败:', err);
    return { code: -1, message: '统计失败', error: err.message };
  }
};