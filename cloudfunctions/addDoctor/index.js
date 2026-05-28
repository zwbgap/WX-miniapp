const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { account, password, nickName, identity } = event;

  try {
    if (!account || !password) {
      return { code: -1, message: '账号和密码不能为空' };
    }

    const db = cloud.database();
    const exists = await db.collection('users').where({ account }).get();

    if (exists.data.length > 0) {
      return { code: -1, message: '账号已存在' };
    }

    const result = await db.collection('users').add({
      data: {
        account: account.trim(),
        password: password,
        nickName: nickName || account,
        identity: identity || 'doctor',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    const newDoctor = await db.collection('users').doc(result._id).get();

    const { password: pwd, ...doctorInfo } = newDoctor.data;

    return {
      code: 0,
      message: '添加成功',
      data: doctorInfo
    };
  } catch (err) {
    console.error('添加医生失败:', err);
    return { code: -1, message: '添加失败', error: err.message };
  }
};