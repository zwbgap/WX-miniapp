const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { account } = event;

  console.log('查询邀请码，account:', account);

  try {
    const db = cloud.database();
    
    let matchedInvite = null;
    
    if (account) {
      // 精确匹配 usedBy
      const result = await db.collection('doctor_invites')
        .where({ usedBy: account })
        .get();
      
      if (result.data.length > 0) {
        matchedInvite = result.data[0];
        console.log('匹配成功:', matchedInvite);
      }
    }
    
    return {
      code: 0,
      message: '查询成功',
      data: {
        matchedInvite: matchedInvite
      }
    };
  } catch (err) {
    console.error('查询邀请码失败:', err);
    return { code: -1, message: '查询失败', error: err.message };
  }
};
