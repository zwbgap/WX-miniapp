const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { medicationId, checkinTime } = event;
  
  try {
    const medication = await db.collection('medications').doc(medicationId).get();
    if (!medication.data || medication.data.userId === undefined) {
      return {
        code: -1,
        message: '用药记录不存在'
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const existingCheckins = medication.data.checkins || [];
    const todayCheckin = existingCheckins.find(c => c.date === today);
    
    let updatedCheckins;
    if (todayCheckin) {
      if (!todayCheckin.times.includes(checkinTime)) {
        todayCheckin.times.push(checkinTime);
      }
      updatedCheckins = existingCheckins;
    } else {
      updatedCheckins = [...existingCheckins, { date: today, times: [checkinTime] }];
    }
    
    await db.collection('medications').doc(medicationId).update({
      data: {
        checkins: updatedCheckins,
        updatedAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '打卡成功',
      data: {
        medicationId,
        checkins: updatedCheckins
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: '打卡失败',
      error: err.message
    };
  }
};