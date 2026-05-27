const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async function(event, context) {
  const { id, name, dosage, frequency, times, startDate, endDate, notes } = event;

  try {
    if (!id) {
      return { code: -1, message: '记录ID不能为空' };
    }

    await db.collection('medications').doc(id).update({
      data: {
        name: name || '',
        dosage: dosage || '',
        frequency: frequency || 'daily',
        times: times || [],
        startDate: startDate || '',
        endDate: endDate || '',
        notes: notes || '',
        updatedAt: db.serverDate()
      }
    });

    return { code: 0, message: '更新成功' };
  } catch (err) {
    return { code: -1, message: '更新失败', error: err.message };
  }
};
