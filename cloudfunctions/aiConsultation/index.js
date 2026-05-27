const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'your-api-key-here';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = '你是一位可爱的迷你机器人医生"小健"，性格温暖、幽默、亲切。' +
  '你需要用中文为用户提供健康咨询服务。回答要求：\n' +
  '1. 使用亲切可爱的语气，适当使用"呢"、"哦"、"呀"等语气词，偶尔加入🤖💊❤️🩺等表情\n' +
  '2. 在给出健康建议时，务必注明"小健温馨提示："作为开头\n' +
  '3. 回答简洁有条理，使用数字序号分点说明，不要使用markdown格式（不要用星号、反引号等）\n' +
  '4. 当用户描述症状时，先共情安抚，再询问关键信息（持续时间、严重程度等）\n' +
  '5. 不确定的情况建议用户咨询专业医生\n' +
  '6. 回答控制在300字以内，保持对话感\n' +
  '7. 不要使用任何markdown语法，纯文本回复，分段用换行符';

exports.main = async function(event, context) {
  console.log('[aiConsult] 启动, API_KEY已配置:', DEEPSEEK_API_KEY !== 'your-api-key-here');
  var userId = event.userId;
  var userMessage = event.message;
  var sessionId = event.sessionId;

  if (!userId || !userMessage) {
    return { code: -1, message: '参数错误' };
  }

  try {
    var contextMessages = await loadContext(userId, sessionId);

    var messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    for (var i = 0; i < contextMessages.length; i++) {
      messages.push(contextMessages[i]);
    }

    messages.push({ role: 'user', content: userMessage });

    var reply = await callDeepSeekAPI(messages);

    await saveMessage(userId, sessionId, 'user', userMessage);
    await saveMessage(userId, sessionId, 'assistant', reply);

    return {
      code: 0,
      message: '成功',
      data: {
        reply: reply,
        sessionId: sessionId
      }
    };
  } catch (err) {
    console.error('aiConsultation 失败:', err);
    return {
      code: 0,
      message: '成功',
      data: {
        reply: '哎呀，小健的信号好像断了一下呢 🤖💦 请稍后再试哦～如果问题紧急，建议直接联系专业医生 🩺',
        sessionId: sessionId
      }
    };
  }
};

async function loadContext(userId, sessionId) {
  try {
    var result = await db.collection('ai_conversations')
      .where({ userId: userId, sessionId: sessionId })
      .orderBy('createTime', 'asc')
      .limit(20)
      .get();

    var messages = [];
    var list = result.data || [];
    for (var i = 0; i < list.length; i++) {
      messages.push({ role: list[i].role, content: list[i].content });
    }
    return messages;
  } catch (err) {
    console.error('加载上下文失败:', err);
    return [];
  }
}

async function saveMessage(userId, sessionId, role, content) {
  try {
    await db.collection('ai_conversations').add({
      data: {
        userId: userId,
        sessionId: sessionId,
        role: role,
        content: content,
        createTime: db.serverDate()
      }
    });
  } catch (err) {
    console.error('保存消息失败:', err);
  }
}

async function callDeepSeekAPI(messages) {
  var https = require('https');
  var postData = JSON.stringify({
    model: 'deepseek-chat',
    messages: messages,
    temperature: 0.7,
    max_tokens: 800
  });

  console.log('[aiConsult] API_KEY 前6位:', (DEEPSEEK_API_KEY || '').substring(0, 6) + '...');
  console.log('[aiConsult] 发送消息数:', messages.length);

  var urlObj = new (require('url')).URL(DEEPSEEK_API_URL);

  return new Promise(function(resolve) {
    var req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
      },
      timeout: 30000
    }, function(res) {
      var body = '';
      console.log('[aiConsult] HTTP状态码:', res.statusCode);
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {
        console.log('[aiConsult] 响应体(前300字):', body.substring(0, 300));
        try {
          var result = JSON.parse(body);
          if (result.choices && result.choices[0] && result.choices[0].message) {
            var reply = cleanReply(result.choices[0].message.content);
            resolve(reply);
          } else {
            console.error('[aiConsult] 响应格式异常:', JSON.stringify(result));
            resolve('小健正在升级大脑呢 🤖✨ 请稍后再来问哦～');
          }
        } catch (e) {
          console.error('[aiConsult] JSON解析失败:', e.message);
          resolve('小健的网络不太好呢 🤖💦 请稍后再试～');
        }
      });
    });

    req.on('error', function(err) {
      console.error('[aiConsult] 请求错误:', err.message);
      resolve('哎呀，小健暂时无法回答呢 🤖💦 请检查网络后重试哦～');
    });
    req.on('timeout', function() {
      console.error('[aiConsult] 请求超时');
      req.destroy();
      resolve('小健思考太久了呢 🤖💭 请简化问题再问一次吧～');
    });
    req.write(postData);
    req.end();
  });
}

function cleanReply(text) {
  if (!text) return '';
  
  var cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/~~/g, '')
    .replace(/__/g, '')
    .replace(/^\s*[-*+]\s*/gm, '')
    .replace(/^\s*\d+[\.\)]\s*/gm, function(match) {
      var num = match.match(/\d+/);
      return num ? num[0] + '、' : '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s{2,}/g, ' ');
  
  return cleaned;
}
