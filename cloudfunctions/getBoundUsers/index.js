const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { doctorId, keyword = '', page = 1, pageSize = 20 } = event;

  try {
    if (!doctorId) {
      return { code: -1, message: '医生ID不能为空' };
    }

    const profilesResult = await db.collection('user_profiles')
      .where({ doctorId: doctorId })
      .get();

    const userIds = profilesResult.data.map(p => p.userId);
    const profileMap = {};
    profilesResult.data.forEach(p => { profileMap[p.userId] = p; });

    if (userIds.length === 0) {
      return { code: 0, data: { list: [], total: 0 } };
    }

    // 并行查询每个用户最新日期的健康档案（按 recordDate 倒序）
    const healthPromises = userIds.map(userId =>
      db.collection('health_records')
        .where({ userId })
        .orderBy('recordDate', 'desc')
        .limit(1)
        .get()
        .then(r => ({ userId, record: (r.data && r.data[0]) || null }))
        .catch(() => ({ userId, record: null }))
    );
    const healthResults = await Promise.all(healthPromises);
    const healthMap = {};
    healthResults.forEach(h => { healthMap[h.userId] = h.record; });

    let usersQuery = db.collection('users').where({
      _id: db.command.in(userIds)
    });

    if (keyword) {
      const reg = db.RegExp({ regexp: keyword, options: 'i' });
      usersQuery = usersQuery.where(
        db.command.or([{ account: reg }, { nickName: reg }])
      );
    }

    const skip = (page - 1) * pageSize;

    const [usersResult, countResult] = await Promise.all([
      usersQuery
        .field({ account: true, nickName: true, avatarUrl: true })
        .skip(skip)
        .limit(pageSize)
        .get(),
      usersQuery.count()
    ]);

    const list = usersResult.data.map(user => {
      const p = profileMap[user._id] || {};
      // 体重从最新健康档案读取
      const health = healthMap[user._id] || {};
      const tizhong = health.tizhong || 0;

      return {
        ...user,
        profile: {
          shengao: p.shengao || 0,
          tizhong: tizhong,
          guominshi: p.guominshi || '',
          jibingshi: p.jibingshi || '',
          jiankangzhuangkuang: p.jiankangzhuangkuang || '',
          xiyan: p.xiyan || '无',
          yinjiul: p.yinjiul || '无',
          yinshi: p.yinshi || '规律',
          yongyao_leixing: p.yongyao_leixing || '',
          yongyao_mingcheng: p.yongyao_mingcheng || '',
          yongyao_guomin: p.yongyao_guomin || '',
          xingming: p.xingming || '',
          nianling: p.nianling || 0,
          xuexing: p.xuexing || '',
          jinji_lianxiren: p.jinji_lianxiren || '',
          jinji_dianhua: p.jinji_dianhua || ''
        }
      };
    });

    return { code: 0, data: { list, total: countResult.total } };
  } catch (err) {
    console.error('获取绑定用户失败:', err);
    return { code: -1, message: '获取失败', error: err.message };
  }
};