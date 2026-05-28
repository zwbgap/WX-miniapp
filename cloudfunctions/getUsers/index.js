const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { keyword, page = 1, pageSize = 20 } = event;

  const db = cloud.database();
  const _ = db.command;

  try {
    let query = db.collection('users').where({ identity: 'user' });

    if (keyword && keyword.trim()) {
      const kw = keyword.trim();
      query = query.where(
        _.or([
          { account: db.RegExp({ regexp: kw, options: 'i' }) },
          { nickName: db.RegExp({ regexp: kw, options: 'i' }) }
        ])
      );
    }

    const countResult = await query.count();
    const total = countResult.total;

    const result = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const users = result.data.map(doc => {
      const { password, ...info } = doc;
      return info;
    });

    return { code: 0, data: { list: users, total } };
  } catch (err) {
    console.error('获取用户列表失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};