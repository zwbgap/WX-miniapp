const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, name, type, dueDate, location, notes } = event;
  
  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }
    
    const vaccine = await db.collection('vaccines').add({
      data: {
        userId,
        name,
        type: type || '',
        dueDate,
        status: 'pending',
        completedDate: null,
        location: location || '',
        notes: notes || '',
        createdAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '添加成功',
      data: {
        _id: vaccine._id,
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