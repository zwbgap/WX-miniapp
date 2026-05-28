const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const { userId, profile, doctorId } = event;

  try {
    let doctorInfo = null;
    if (doctorId) {
      const doctorResult = await db.collection('users')
        .where({ _id: doctorId, identity: 'doctor' })
        .limit(1)
        .get();
      
      if (doctorResult.data && doctorResult.data.length > 0) {
        const doctor = doctorResult.data[0];
        doctorInfo = {
          _id: doctor._id,
          account: doctor.account,
          nickName: doctor.nickName,
          employeeId: doctor.employeeId || '',
          phone: doctor.phone || '',
          department: doctor.department || '',
          title: doctor.title || ''
        };
      }
    }

    const profileData = {
      userId,
      ...profile,
      doctorId: doctorId || null,
      doctorInfo,
      updatedAt: db.serverDate()
    };

    const existResult = await db.collection('user_profiles')
      .where({ userId })
      .limit(1)
      .get();

    if (existResult.data && existResult.data.length > 0) {
      await db.collection('user_profiles')
        .doc(existResult.data[0]._id)
        .update({ data: profileData });
    } else {
      profileData.createdAt = db.serverDate();
      await db.collection('user_profiles').add({ data: profileData });
    }

    return { code: 0, data: { doctorInfo }, message: '保存成功' };
  } catch (err) {
    console.error('保存用户档案失败:', err);
    return { code: -1, message: '保存失败', error: err.message };
  }
};
