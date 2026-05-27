const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { account, password } = event;

  try {
    if (!account || !password) {
      return { code: -1, message: '账号和密码不能为空' };
    }

    if (account.length < 3) {
      return { code: -1, message: '账号不能少于3位' };
    }

    if (password.length < 6) {
      return { code: -1, message: '密码不能少于6位' };
    }

    const db = cloud.database();
    const existingUser = await db.collection('users').where({ account }).get();

    if (existingUser.data.length > 0) {
      return { code: -1, message: '该账号已被注册' };
    }

    const avatarStyles = ['avataaars', 'bottts', 'croodles', 'micah', 'miniavs', 'personas', 'pixel-art', 'shapes', 'thumbs'];
    const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(account)}&size=200`;

    const result = await db.collection('users').add({
      data: {
        account,
        password: password,
        avatarUrl: avatarUrl,
        createdAt: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '注册成功',
      data: {
        _id: result._id,
        account: account,
        avatarUrl: avatarUrl
      }
    };
  } catch (err) {
    console.error('注册失败:', err);
    return { code: -1, message: '注册失败', error: err.message };
  }
};