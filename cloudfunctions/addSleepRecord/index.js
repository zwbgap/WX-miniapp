const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, sleepTime, wakeTime, duration, quality, deepSleep, lightSleep } = event;
  
  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }
    
    const record = await db.collection('sleep_records').add({
      data: {
        userId,
        sleepTime,
        wakeTime,
        duration,
        quality: quality || 'normal',
        deepSleep: deepSleep || 0,
        lightSleep: lightSleep || 0,
        createdAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '添加成功',
      data: {
        _id: record._id,
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