const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  
  try {
    const result = await db.collection('users').where({ openid: OPENID }).get();
    
    if (result.data.length === 0) {
      const user = await db.collection('users').add({
        data: {
          openid: OPENID,
          createdAt: db.serverDate()
        }
      });
      
      return {
        code: 0,
        message: '注册成功',
        data: {
          _id: user._id,
          openid: OPENID
        }
      };
    }
    
    return {
      code: 0,
      message: '登录成功',
      data: result.data[0]
    };
  } catch (err) {
    return {
      code: -1,
      message: '登录失败',
      error: err.message
    };
  }
};