const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { id } = event;

  try {
    if (!id) {
      return {
        code: -1,
        message: '记录ID不能为空'
      };
    }

    const result = await db.collection('health_records').doc(id).remove();

    if (result.stats.removed === 0) {
      return {
        code: -1,
        message: '记录不存在或已被删除'
      };
    }

    return {
      code: 0,
      message: '删除成功'
    };
  } catch (err) {
    return {
      code: -1,
      message: '删除失败',
      error: err.message
    };
  }
};
