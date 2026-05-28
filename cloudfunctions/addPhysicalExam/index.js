const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { doctorId, userId, title, content, reportDate } = event;

  try {
    if (!doctorId || !userId || !title || !content || !reportDate) {
      return { code: -1, message: '参数不完整' };
    }

    var doctor = null;
    try {
      const doctorResult = await db.collection('users').doc(doctorId).get();
      if (doctorResult.data && doctorResult.data.identity === 'doctor') {
        doctor = doctorResult.data;
      }
    } catch (e) {
      return { code: -1, message: '医生不存在' };
    }

    var user = null;
    try {
      const userResult = await db.collection('users').doc(userId).get();
      user = userResult.data || {};
    } catch (e) {
      return { code: -1, message: '用户不存在' };
    }

    var profile = {};
    try {
      const profileResult = await db.collection('user_profiles')
        .where({ userId: userId })
        .limit(1)
        .get();
      profile = (profileResult.data && profileResult.data[0]) || {};
    } catch (e) {
    }

    var userName = profile.xingming || user.nickName || user.account || userId;

    var record = {
      doctorId: doctorId,
      userId: userId,
      userName: userName,
      userAccount: user.account || '',
      doctorName: doctor.nickName || doctor.account || '',
      doctorDepartment: doctor.department || '',
      doctorTitle: doctor.title || '',
      title: title.trim(),
      content: content.trim(),
      reportDate: reportDate,
      createdAt: db.serverDate()
    };

    await db.collection('physical_exam').add({ data: record });

    return { code: 0, message: '发送成功', data: record };
  } catch (err) {
    console.error('发送体检报告失败:', err);
    return { code: -1, message: '发送失败: ' + (err.message || '未知错误') };
  }
};