const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { account, password, identity } = event;

  console.log('登录请求:', { account, identity });

  try {
    if (!account || !password) {
      return { code: -1, message: '账号和密码不能为空' };
    }

    if (!identity || (identity !== 'user' && identity !== 'doctor' && identity !== 'admin')) {
      return { code: -1, message: '身份选择错误' };
    }

    // 管理员账号硬编码验证
    if (account === 'admin' && password === 'admin') {
      if (identity !== 'admin') {
        return { code: -1, message: '管理员身份不匹配' };
      }
      console.log('管理员登录成功');
      return {
        code: 0,
        message: '登录成功',
        data: {
          _id: 'admin',
          account: 'admin',
          nickName: '管理员',
          identity: 'admin'
        }
      };
    }

    const db = cloud.database();

    const result = await db.collection('users').where({ account, identity }).get();

    if (result.data.length === 0) {
      return { code: -1, message: '账号不存在或身份错误' };
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