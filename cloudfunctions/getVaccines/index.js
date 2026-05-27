const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, status } = event;

  try {
    if (!userId) {
      return {
        code: -1,
        message: '用户ID不能为空'
      };
    }

    let query = db.collection('vaccines').where({ userId });
    
    const result = await query.orderBy('tixingshijian', 'asc').get();

    const records = result.data.map(item => ({
      ...item,
      yimiaomingcheng: item.yimiaomingcheng || item.name || '',
      tixingshijian: item.tixingshijian || item.dueDate || '',
      jiezhongdidian: item.jiezhongdidian || item.location || '',
      zhuangtai: item.zhuangtai || item.status || '待接种',
      advanceDays: item.advanceDays || 1,
      jiezhongshijian: item.jiezhongshijian || '',
      beizhu: item.beizhu || item.notes || ''
    }));

    return {
      code: 0,
      message: '获取成功',
      data: records
    };
  } catch (err) {
    return {
      code: -1,
      message: '获取失败',
      error: err.message
    };
  }
};
