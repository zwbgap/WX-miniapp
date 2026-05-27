const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async function(event, context) {
  var userId = event.userId;
  var sessionId = event.sessionId;

  if (!userId) {
    return { code: -1, message: '参数错误' };
  }

  try {
    var query = { userId: userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    var allDocs = await db.collection('ai_conversations').where(query).limit(100).get();
    var docs = allDocs.data || [];
    for (var i = 0; i < docs.length; i++) {
      await db.collection('ai_conversations').doc(docs[i]._id).remove();
    }
    console.log('已清除 ' + docs.length + ' 条对话记录');
    return { code: 0, message: '已清除', count: docs.length };
  } catch (err) {
    console.error('清除上下文失败:', err);
    return { code: -1, message: err.message };
  }
};
