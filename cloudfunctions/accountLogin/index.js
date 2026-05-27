const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { account, password } = event;

  try {
    if (!account || !password) {
      return { code: -1, message: '账号和密码不能为空' };
    }

    const db = cloud.database();
    const result = await db.collection('users').where({ account }).get();

    if (result.data.length === 0) {
      return { code: -1, message: '账号不存在' };
    }

    const user = result.data[0];

    if (user.password !== password) {
      return { code: -1, message: '密码错误' };
    }

    const { password: pwd, ...userInfo } = user;

    return {
      code: 0,
      message: '登录成功',
      data: userInfo
    };
  } catch (err) {
    console.error('登录失败:', err);
    return { code: -1, message: '登录失败', error: err.message };
  }
};