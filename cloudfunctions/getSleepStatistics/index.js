const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, days = 7 } = event;

  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const result = await db.collection('sleep_records')
      .where({
        userId,
        rushuishijian: db.command.gte(startDate.toISOString())
      })
      .orderBy('rushuishijian', 'asc')
      .get();

    const records = result.data;

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const sleepTrend = [];
    let totalDuration = 0;
    let totalQuality = 0;
    let qualityCount = 0;
    let qualityCounts = { good: 0, normal: 0, bad: 0 };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];

      const record = records.find(r => r.rushuishijian && r.rushuishijian.startsWith(dateStr));

      if (record) {
        const minutes = parseInt(record.shuimianshizhang) || 0;
        const hours = (minutes / 60).toFixed(1);
        sleepTrend.push({
          date: dayName,
          hours: parseFloat(hours)
        });
        totalDuration += minutes;

        const qualityVal = parseInt(record.shuimianzhiliang) || 3;
        totalQuality += qualityVal;
        qualityCount++;

        if (qualityVal >= 4) qualityCounts.good++;
        else if (qualityVal >= 3) qualityCounts.normal++;
        else qualityCounts.bad++;
      } else {
        sleepTrend.push({
          date: dayName,
          hours: 0
        });
      }
    }

    const avgDurationMinutes = records.length > 0 ? (totalDuration / records.length) : 0;
    const avgDurationHours = (avgDurationMinutes / 60).toFixed(1);
    const avgQuality = qualityCount > 0 ? (totalQuality / qualityCount).toFixed(1) : 0;

    return {
      code: 0,
      message: '获取成功',
      data: {
        sleepTrend,
        avgDuration: parseFloat(avgDurationHours),
        avgQuality: parseFloat(avgQuality),
        totalDays: records.length,
        qualityDistribution: qualityCounts
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
