const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, page = 1, limit = 10 } = event;

  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }

    const skip = (page - 1) * limit;

    const result = await db.collection('sleep_records')
      .where({ userId })
      .orderBy('rushuishijian', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    const countResult = await db.collection('sleep_records')
      .where({ userId })
      .count();

    const records = result.data.map(item => {
      const sleepTime = item.rushuishijian || item.sleepTime || '';
      const wakeTime = item.qichuangshijian || item.wakeTime || '';
      const duration = item.shuimianshizhang || item.duration || 0;
      const quality = item.shuimianzhiliang || item.quality || 3;
      const date = item.jiluriqi || (sleepTime ? sleepTime.split('T')[0] : '');
      
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      const durationDisplay = duration > 0 ? hours + '小时' + minutes + '分钟' : '--';

      return {
        ...item,
        jiluriqi: date,
        rushuishijian: sleepTime,
        qichuangshijian: wakeTime,
        shuimianshizhang: duration,
        shuimianzhiliang: quality,
        jiluneirong: item.jiluneirong || item.note || '',
        durationDisplay: durationDisplay
      };
    });

    return {
      code: 0,
      message: '获取成功',
      data: {
        records: records,
        total: countResult.total,
        page,
        limit
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    };
  }
};
