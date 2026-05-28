const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const { userId } = event;
  
  console.log('unbindUser 开始，userId:', userId);

  try {
    const profileResult = await db.collection('user_profiles')
      .where({ userId: userId })
      .limit(1)
      .get();

    console.log('profileResult:', profileResult);

    if (profileResult.data && profileResult.data.length > 0) {
      const recordId = profileResult.data[0]._id;
      console.log('找到记录，_id:', recordId);
      
      const updateResult = await db.collection('user_profiles')
        .doc(recordId)
        .update({
          data: {
            doctorId: null,
            doctorInfo: null,
            updatedAt: db.serverDate()
          }
        });
        
      console.log('updateResult:', updateResult);
      return { code: 0, message: '解除绑定成功', stats: updateResult.stats };
    } else {
      console.log('未找到该用户的档案记录');
      return { code: -1, message: '未找到用户档案' };
    }
  } catch (err) {
    console.error('unbindUser 失败:', err);
    return { code: -1, message: '解除绑定失败', error: err.message };
  }
};