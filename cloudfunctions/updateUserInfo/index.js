const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { nickname, avatarUrl, phone, gender, birthday } = event;
  
  try {
    const userData = {};
    if (nickname !== undefined) userData.nickname = nickname;
    if (avatarUrl !== undefined) userData.avatarUrl = avatarUrl;
    if (phone !== undefined) userData.phone = phone;
    if (gender !== undefined) userData.gender = gender;
    if (birthday !== undefined) userData.birthday = birthday;
    userData.updatedAt = db.serverDate();
    
    await db.collection('users').where({ openid: OPENID }).update({
      data: userData
    });
    
    const result = await db.collection('users').where({ openid: OPENID }).get();
    
    return {
      code: 0,
      message: '更新成功',
      data: result.data[0]
    };
  } catch (err) {
    return {
      code: -1,
      message: '更新失败',
      error: err.message
    };
  }
};