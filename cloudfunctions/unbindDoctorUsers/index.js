const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { doctorId } = event;

  try {
    if (!doctorId) {
      return { code: -1, message: '医生ID不能为空' };
    }

    const db = cloud.database();

    // 更新 user_profiles 集合，解除绑定
    const result = await db.collection('user_profiles')
      .where({ doctorId: doctorId })
      .update({
        data: {
          doctorId: null,
          doctorInfo: null,
          updatedAt: db.serverDate()
        }
      });

    return {
      code: 0,
      message: '解除绑定成功',
      data: { updated: result.updated }
    };
  } catch (err) {
    console.error('解除绑定失败:', err);
    return { code: -1, message: '解除绑定失败', error: err.message };
  }
};
