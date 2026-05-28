const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;
  const { userId, profile, doctorId } = event;

  console.log('saveUserProfile 开始，userId:', userId, 'doctorId:', doctorId);

  try {
    let doctorInfo = null;
    if (doctorId) {
      console.log('查询医生信息，doctorId:', doctorId);
      const doctorResult = await db.collection('users')
        .where({ _id: doctorId, identity: 'doctor' })
        .limit(1)
        .get();

      console.log('医生查询结果:', doctorResult);

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
        console.log('构造的doctorInfo:', doctorInfo);
      }
    }

    const existResult = await db.collection('user_profiles')
      .where({ userId })
      .limit(1)
      .get();

    console.log('existResult:', existResult);

    if (existResult.data && existResult.data.length > 0) {
      const recordId = existResult.data[0]._id;
      const existingRecord = existResult.data[0];
      console.log('更新现有记录，_id:', recordId);

      // 如果现有的 doctorInfo 是 null，会导致无法直接更新
      // 需要先移除 null 字段
      if (existingRecord.doctorInfo === null) {
        console.log('doctorInfo 是 null，先移除字段');
        await db.collection('user_profiles')
          .doc(recordId)
          .update({
            data: {
              doctorId: _.remove(),
              doctorInfo: _.remove()
            }
          });
        console.log('已移除 null 字段');
      }

      // 构建更新数据
      const updateData = {
        ...profile,
        updatedAt: db.serverDate()
      };

      // 处理 doctorId 和 doctorInfo 字段
      if (doctorId) {
        // 有新的医生ID，设置医生信息
        updateData.doctorId = doctorId;
        updateData.doctorInfo = doctorInfo;
      }
      // else: 没有医生ID，不设置这两个字段即可（已经被 remove 掉了）

      console.log('updateData:', updateData);

      await db.collection('user_profiles')
        .doc(recordId)
        .update({ data: updateData });
      console.log('更新成功');

    } else {
      // 添加新记录
      console.log('添加新记录');
      const profileData = {
        userId,
        ...profile,
        doctorId: doctorId || null,
        doctorInfo: doctorInfo || null,
        updatedAt: db.serverDate(),
        createdAt: db.serverDate()
      };

      console.log('profileData:', profileData);

      await db.collection('user_profiles').add({ data: profileData });
      console.log('添加成功');
    }

    console.log('saveUserProfile 成功');
    return { code: 0, data: { doctorInfo }, message: '保存成功' };
  } catch (err) {
    console.error('saveUserProfile 失败:', err);
    return { code: -1, message: '保存失败', error: err.message };
  }
};