const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  try {
    const db = cloud.database();
    const { doctorId } = event;

    let doctorsQuery = db.collection('users').where({ identity: 'doctor' });

    if (doctorId) {
      doctorsQuery = doctorsQuery.where({ _id: doctorId });
    }

    const doctorsResult = await doctorsQuery
      .field({ account: true, nickName: true, avatarUrl: true })
      .get();

    const bindings = [];

    for (const doctor of doctorsResult.data) {
      const usersResult = await db.collection('user_profiles')
        .where({ doctorId: doctor._id })
        .field({ _id: true })
        .get();

      bindings.push({
        doctorId: doctor._id,
        doctorName: doctor.nickName || doctor.account,
        doctorAvatar: doctor.avatarUrl,
        userCount: usersResult.data.length
      });
    }

    return { code: 0, data: { list: bindings } };
  } catch (err) {
    console.error('获取绑定关系失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};