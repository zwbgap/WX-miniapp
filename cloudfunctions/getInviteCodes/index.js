const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { pageSize = 20, pageIndex = 1 } = event;

  try {
    const db = cloud.database();
    const countResult = await db.collection('doctor_invites').count();

    const result = await db.collection('doctor_invites')
      .orderBy('createdAt', 'desc')
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 收集所有已使用的邀请码的 usedBy
    const usedByAccounts = [];
    const inviteList = result.data;
    
    for (const invite of inviteList) {
      if (invite.used && invite.usedBy) {
        usedByAccounts.push(invite.usedBy);
      }
    }
    
    // 查询对应的医生信息
    let doctorMap = {};
    if (usedByAccounts.length > 0) {
      const doctorResult = await db.collection('users')
        .where({
          account: db.command.in(usedByAccounts)
        })
        .get();
      
      for (const doctor of doctorResult.data) {
        doctorMap[doctor.account] = doctor;
      }
    }
    
    // 组装数据
    const finalList = inviteList.map(invite => ({
      ...invite,
      doctorInfo: (invite.used && invite.usedBy) ? doctorMap[invite.usedBy] : null
    }));

    return {
      code: 0,
      message: '获取成功',
      data: {
        list: finalList,
        total: countResult.total,
        pageSize,
        pageIndex
      }
    };
  } catch (err) {
    console.error('获取邀请码列表失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};