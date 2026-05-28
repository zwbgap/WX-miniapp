const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const { doctorId, nickName, employeeId, phone, department, title, email, address } = event;

  try {
    const updateData = {
      nickName: nickName || '',
      employeeId: employeeId || '',
      phone: phone || '',
      department: department || '',
      title: title || '',
      email: email && email.trim() ? email.trim() : null,
      address: address && address.trim() ? address.trim() : null,
      updatedAt: db.serverDate()
    };

    await db.collection('users').doc(doctorId).update({ data: updateData });

    const doctorInfo = {
      _id: doctorId,
      account: (await db.collection('users').doc(doctorId).get()).data.account,
      nickName: updateData.nickName,
      employeeId: updateData.employeeId,
      phone: updateData.phone,
      department: updateData.department,
      title: updateData.title,
      email: updateData.email,
      address: updateData.address
    };

    await db.collection('user_profiles')
      .where({ doctorId })
      .update({
        data: {
          doctorInfo,
          updatedAt: db.serverDate()
        }
      });

    return { code: 0, data: doctorInfo, message: '更新成功' };
  } catch (err) {
    console.error('更新医生信息失败:', err);
    return { code: -1, message: '更新失败', error: err.message };
  }
};
