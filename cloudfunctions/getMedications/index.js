const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId } = event;
  
  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }
    
    const result = await db.collection('medications')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .get();
    
    return {
      code: 0,
      message: '获取成功',
      data: result.data
    };
  } catch (err) {
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    };
  }
};