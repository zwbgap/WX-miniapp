const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { doctorId, userIds } = event;

  try {
    if (!doctorId || !userIds || userIds.length === 0) {
      return { code: -1, message: '参数不完整' };
    }

    const db = cloud.database();
    
    // 获取医生信息
    const doctorResult = await db.collection('users')
      .where({ _id: doctorId, identity: 'doctor' })
      .limit(1)
      .get();

    if (!doctorResult.data || doctorResult.data.length === 0) {
      return { code: -1, message: '医生不存在' };
    }

    const doctor = doctorResult.data[0];
    const doctorInfo = {
      _id: doctor._id,
      account: doctor.account,
      nickName: doctor.nickName,
      employeeId: doctor.employeeId || '',
      phone: doctor.phone || '',
      department: doctor.department || '',
      title: doctor.title || ''
    };

    // 批量更新 user_profiles 集合中的 doctorId 和 doctorInfo
    for (const userId of userIds) {
      const existResult = await db.collection('user_profiles')
        .where({ userId })
        .limit(1)
        .get();

      if (existResult.data && existResult.data.length > 0) {
        // 更新已存在的档案
        await db.collection('user_profiles')
          .doc(existResult.data[0]._id)
          .update({
            data: {
              doctorId: doctorId,
              doctorInfo: doctorInfo,
              updatedAt: db.serverDate()
            }
          });
      } else {
        // 创建新档案
        await db.collection('user_profiles').add({
          data: {
            userId: userId,
            doctorId: doctorId,
            doctorInfo: doctorInfo,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        });
      }
    }

    return {
      code: 0,
      message: `成功绑定 ${userIds.length} 个用户`,
      data: { count: userIds.length }
    };
  } catch (err) {
    console.error('绑定用户失败:', err);
    return { code: -1, message: '绑定失败', error: err.message };
  }
};
