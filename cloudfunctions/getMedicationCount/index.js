const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  try {
    const result = await db.collection('medication_reminders').count();
    return { code: 0, data: { count: result.total } };
  } catch (err) {
    console.error('统计用药提醒数量失败:', err);
    return { code: -1, message: '统计失败', error: err.message };
  }
};