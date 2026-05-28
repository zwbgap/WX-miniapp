const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { account, password, identity, inviteCode } = event;

  console.log('注册请求:', { account, identity, inviteCode });

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

    // 检查账号是否已存在
    const existingUser = await db.collection('users').where({ account }).get();

    if (existingUser.data.length > 0) {
      return { code: -1, message: '该账号已被注册' };
    }

    // 医生注册必须提供邀请码
    if (identity === 'doctor') {
      if (!inviteCode) {
        return { code: -1, message: '医生注册需要邀请码' };
      }

      const inviteResult = await db.collection('doctor_invites')
        .where({ code: inviteCode, used: false })
        .get();

      if (inviteResult.data.length === 0) {
        return { code: -1, message: '邀请码无效或已使用' };
      }

      const invite = inviteResult.data[0];

      if (invite.account && invite.account !== account) {
        return { code: -1, message: '邀请码与账号不匹配' };
      }

      await db.collection('doctor_invites')
        .doc(invite._id)
        .update({
          data: {
            used: true,
            usedBy: account,
            usedAt: db.serverDate()
          }
        });
    }

    const avatarStyles = ['avataaars', 'bottts', 'croodles', 'micah', 'miniavs', 'personas', 'pixel-art', 'shapes', 'thumbs'];
    const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(account)}&size=200`;

    const finalIdentity = identity === 'doctor' ? 'doctor' : 'user';

    console.log('创建用户 identity:', finalIdentity);

    const result = await db.collection('users').add({
      data: {
        account,
        password: password,
        avatarUrl: avatarUrl,
        identity: finalIdentity,
        inviteCode: inviteCode || '',
        createdAt: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '注册成功',
      data: {
        _id: result._id,
        account: account,
        avatarUrl: avatarUrl,
        identity: finalIdentity
      }
    };
  } catch (err) {
    console.error('注册失败:', err);
    return { code: -1, message: '注册失败', error: err.message };
  }
};