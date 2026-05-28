const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { doctorId } = event;

  try {
    const db = cloud.database();

    const result = await db.collection('users')
      .where({
        identity: 'user',
        doctorId: db.command.neq(null)
      })
      .get();

    return { code: 0, data: { list: result.data } };
  } catch (err) {
    console.error('获取未绑定用户失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};