const cloud = require('wx-server-sdk');
cloud.init();

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.main = async (event, context) => {
  const { account, count = 1 } = event;

  try {
    if (count < 1 || count > 10) {
      return { code: -1, message: '数量需在1-10之间' };
    }

    const db = cloud.database();
    const codes = [];

    for (let i = 0; i < count; i++) {
      let code = generateCode();

      // 确保邀请码唯一
      let existing = await db.collection('doctor_invites').where({ code }).get();
      while (existing.data.length > 0) {
        code = generateCode();
        existing = await db.collection('doctor_invites').where({ code }).get();
      }

      const result = await db.collection('doctor_invites').add({
        data: {
          code,
          account: account || null,
          used: false,
          createdAt: db.serverDate()
        }
      });

      codes.push({
        _id: result._id,
        code
      });
    }

    return { code: 0, message: '生成成功', data: { codes } };
  } catch (err) {
    console.error('生成邀请码失败:', err);
    return { code: -1, message: '生成失败', error: err.message };
  }
};