const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, name, dosage, frequency, times, startDate, endDate, notes } = event;
  
  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }
    
    const medication = await db.collection('medications').add({
      data: {
        userId,
        name,
        dosage,
        frequency: frequency || 'daily',
        times: times || [],
        startDate,
        endDate,
        notes: notes || '',
        status: 'active',
        checkins: [],
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '添加成功',
      data: {
        _id: medication._id,
        userId
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: '添加失败',
      error: err.message
    };
  }
};