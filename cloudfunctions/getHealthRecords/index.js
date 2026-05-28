const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, page = 1, limit = 10 } = event;
  
  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }
    
    const skip = (page - 1) * limit;
    
    const result = await db.collection('health_records')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get();
    
    const countResult = await db.collection('health_records')
      .where({ userId })
      .count();
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        records: result.data,
        total: countResult.total,
        page,
        limit
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    };
  }
};