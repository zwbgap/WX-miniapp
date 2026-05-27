const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { vaccineId, completedDate } = event;
  
  try {
    const vaccine = await db.collection('vaccines').doc(vaccineId).get();
    if (!vaccine.data) {
      return {
        code: -1,
        message: '疫苗记录不存在'
      };
    }
    
    await db.collection('vaccines').doc(vaccineId).update({
      data: {
        zhuangtai: '已接种',
        jiezhongshijian: completedDate || new Date().toISOString().split('T')[0],
        updatedAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '接种完成',
      data: {
        vaccineId: vaccineId,
        zhuangtai: '已接种'
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: '操作失败',
      error: err.message
    };
  }
};