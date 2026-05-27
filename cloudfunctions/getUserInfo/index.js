const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  
  try {
    const result = await db.collection('users').where({ openid: OPENID }).get();
    
    if (result.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      };
    }
    
    return {
      code: 0,
      message: '获取成功',
      data: result.data[0]
    };
  } catch (err) {
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    };
  }
};