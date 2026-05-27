const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'your-api-key-here';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

function getRandomImageUrl(index) {
  var seeds = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&h=400&fit=crop'
  ];
  return seeds[index % seeds.length];
}

var ALL_CATEGORIES = [
  '营养饮食', '运动健身', '心理健康', '疾病预防', '睡眠健康',
  '中医养生', '妇幼保健', '慢病管理', '体重控制', '养生保健'
];

exports.main = async function(event, context) {
  try {
    await deleteAllNews();

    var todayStr = new Date().toISOString().split('T')[0];

    if (DEEPSEEK_API_KEY === 'your-api-key-here') {
      return await generateFallbackNews(todayStr);
    }

    var categoryList = ALL_CATEGORIES.join('、');
    var prompt = '你是一个专业的健康资讯编辑。请生成10条今日热门健康资讯，用JSON数组格式返回。' +
      '每条包含：title(标题,15字以内)、summary(摘要,50字以内)、content(正文,200-400字,用\\n\\n分段)。' +
      '必须严格按顺序覆盖以下10个领域各1条（顺序不可错）：' + categoryList + '。' +
      '内容要专业准确、贴近生活、主题互不重复。直接返回JSON数组，不要markdown代码块。';

    var response = await callDeepSeekAPI(prompt);
    var articles = parseArticles(response);

    if (!articles || articles.length === 0) {
      return await generateFallbackNews(todayStr);
    }

    var results = [];
    for (var i = 0; i < articles.length && i < 10; i++) {
      var article = articles[i];
      var category = article.category || ALL_CATEGORIES[i % ALL_CATEGORIES.length];
      var newsItem = {
        title: article.title || '健康资讯',
        summary: article.summary || '',
        content: article.content || '',
        category: category,
        picture: article.picture || getRandomImageUrl(i),
        date: todayStr,
        publishTime: todayStr,
        views: Math.floor(Math.random() * 500) + 50,
        createdAt: db.serverDate()
      };

      var addResult = await db.collection('health_news').add({ data: newsItem });
      newsItem._id = addResult._id;
      results.push(newsItem);
    }

    return { code: 0, message: '生成成功', count: results.length, data: results };
  } catch (err) {
    console.error('generateHealthNews 失败:', err);
    var todayStr = new Date().toISOString().split('T')[0];
    return await generateFallbackNews(todayStr);
  }
};

async function deleteAllNews() {
  try {
    var allDocs = await db.collection('health_news').limit(100).get();
    var docs = allDocs.data || [];
    for (var i = 0; i < docs.length; i++) {
      await db.collection('health_news').doc(docs[i]._id).remove();
    }
    console.log('已删除旧资讯 ' + docs.length + ' 条');
  } catch (err) {
    console.error('删除旧资讯失败:', err);
  }
}

async function callDeepSeekAPI(prompt) {
  var https = require('https');
  var postData = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一个专业的健康资讯编辑，只返回JSON格式数据。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 6000
  });

  var urlObj = new (require('url')).URL(DEEPSEEK_API_URL);

  return new Promise(function(resolve, reject) {
    var req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
      },
      timeout: 60000
    }, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {
        try {
          var result = JSON.parse(body);
          if (result.choices && result.choices[0] && result.choices[0].message) {
            resolve(result.choices[0].message.content);
          } else {
            reject(new Error('DeepSeek API 返回格式异常'));
          }
        } catch (e) {
          reject(new Error('解析响应失败: ' + e.message));
        }
      });
    });

    req.on('error', function(e) { reject(e); });
    req.on('timeout', function() { req.destroy(); reject(new Error('请求超时')); });
    req.write(postData);
    req.end();
  });
}

function parseArticles(response) {
  var jsonStr = response.trim();
  if (jsonStr.indexOf('```json') === 0) {
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  } else if (jsonStr.indexOf('```') === 0) {
    jsonStr = jsonStr.replace(/```\s*/g, '');
  }

  try {
    var articles = JSON.parse(jsonStr);
    if (Array.isArray(articles)) return articles;
    if (articles && Array.isArray(articles.articles)) return articles.articles;
    return [];
  } catch (e) {
    console.error('JSON解析失败:', e.message);
    return [];
  }
}

async function generateFallbackNews(todayStr) {
  var existingNews = await db.collection('health_news').get();
  if (existingNews.data.length >= 10) {
    return { code: 0, message: '已有10条资讯', count: existingNews.data.length };
  }

  var fallbackData = [
    {
      title: '春季饮食调理：这5种食物助你增强免疫力',
      summary: '春天是调养身体的最佳时节，合理饮食能有效提升免疫力，预防疾病。',
      content: '春季万物复苏，人体新陈代谢加快，正是调理身体的好时机。专家建议多食用以下食物：\n\n1. 菠菜——富含铁质和维生素C，有助于补血养气。\n2. 山药——健脾养胃，适合春季体质虚弱者。\n3. 韭菜——温补阳气，被称为"春季第一菜"。\n4. 蜂蜜——润肺止咳，每天一杯蜂蜜水有助于清理肠道。\n5. 柑橘类水果——富含维生素C，增强抵抗力。\n\n保持饮食均衡，配合适当运动，才能让身体在春天焕发活力。',
      category: '营养饮食'
    },
    {
      title: '每天30分钟运动的神奇益处，科学研究告诉你',
      summary: '适度运动不仅能保持身材，更能改善心理健康和睡眠质量。',
      content: '《柳叶刀》杂志发布的研究显示，每天坚持30分钟中等强度运动可以显著改善身心健康。\n\n运动的好处包括：改善心血管健康，降低高血压风险；促进大脑释放内啡肽，缓解焦虑和抑郁；提高睡眠质量，缩短入睡时间；增强骨密度，预防骨质疏松。\n\n专家建议选择自己喜欢的运动方式，如快走、游泳、骑行等，关键在于长期坚持而非运动强度。',
      category: '运动健身'
    },
    {
      title: '冥想入门：5分钟让你告别焦虑，重获内心平静',
      summary: '科学研究证实冥想能有效降低压力激素水平，改善情绪状态。',
      content: '在快节奏的现代生活中，冥想已成为一种简单有效的减压方式。哈佛大学的研究表明，每天5-10分钟的冥想练习可以带来显著改变。\n\n初学者冥想指南：找一个安静的地方坐下，闭上眼睛，专注于呼吸的进出。当思绪飘移时，温柔地将注意力带回呼吸。不要评判自己，接纳所有感受。\n\n坚持两周后，大多数人报告焦虑水平下降、注意力提升、睡眠改善。试试看，你会惊讶于这种简单练习带来的变化。',
      category: '心理健康'
    },
    {
      title: '疫苗接种全攻略：成人也需要关注这些疫苗',
      summary: '疫苗接种不只是儿童的事，成年人同样需要定期接种多种疫苗来保护健康。',
      content: '很多人认为疫苗接种是儿童的专利，但成年人同样面临多种传染病风险。以下是成人应关注的疫苗：\n\n流感疫苗——每年秋冬季节接种，尤其推荐老年人和慢性病患者。\n乙肝疫苗——未接种过或抗体不足的成年人应补种。\nHPV疫苗——适用于9-45岁人群，有效预防宫颈癌。\n带状疱疹疫苗——推荐50岁以上人群接种。\n\n接种前请咨询医生，根据个人健康状况制定适合自己的接种计划。',
      category: '疾病预防'
    },
    {
      title: '改善睡眠的黄金法则：从今晚开始睡得更好',
      summary: '良好的睡眠是健康的基石，掌握这些技巧提升你的睡眠质量。',
      content: '世界卫生组织指出，全球约27%的人存在睡眠问题。良好的睡眠对身体健康至关重要，以下是改善睡眠的黄金法则：\n\n固定作息时间——每天同一时间上床和起床，培养生物钟规律。\n睡前远离蓝光——睡前1小时不看手机电脑，蓝光会抑制褪黑素分泌。\n营造舒适环境——保持卧室黑暗、安静、凉爽（18-22℃最佳）。\n避免睡前大餐——睡前3小时不进食，避免咖啡因和酒精。\n\n坚持这些习惯21天，你会发现睡眠质量明显提升。',
      category: '睡眠健康'
    },
    {
      title: '中医体质辨识：九种体质你是哪一种？',
      summary: '了解自己的体质类型，才能真正做到对症养生，事半功倍。',
      content: '中医将人体体质分为九种：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质。每种体质都有独特的表现和调理方法。\n\n气虚体质常见表现：容易疲劳，说话声音低弱，容易出汗。建议多食用山药、大枣、小米等补气食物，避免过度劳累。\n\n湿热体质常见表现：面垢油光，口苦口干，大便黏滞。建议多食绿豆、冬瓜、薏米等清热利湿食物，少吃辛辣油腻。',
      category: '中医养生'
    },
    {
      title: '孕期营养补充指南：每个阶段吃对才健康',
      summary: '孕期不同阶段营养需求不同，科学补充确保母婴健康。',
      content: '孕期营养直接影响胎儿发育和母体健康。整个孕期分为三个阶段，营养重点各有不同。\n\n孕早期（1-12周）：补充叶酸最关键，每天400-800微克可预防神经管畸形。多吃深绿色蔬菜、豆类、柑橘类水果。同时注意补充维生素B6缓解孕吐。\n\n孕中期（13-27周）：胎儿快速发育，需增加蛋白质摄入，每天额外补充300大卡热量。重点补充铁和钙，预防贫血和骨质疏松。\n\n孕晚期（28-40周）：胎儿大脑发育巅峰期，补充DHA和优质蛋白至关重要。',
      category: '妇幼保健'
    },
    {
      title: '高血压患者日常管理：饮食运动双管齐下',
      summary: '科学管理高血压，从每日饮食和规律运动开始，远离并发症。',
      content: '我国高血压患者已超过2.45亿，规范管理对预防心脑血管事件至关重要。\n\n饮食管理：采用DASH饮食模式，每日食盐摄入不超过5克。多吃全谷物、蔬菜水果、低脂奶制品。限制红肉和含糖饮料。增加富钾食物如香蕉、土豆、菠菜的摄入。\n\n运动建议：每周至少150分钟中等强度有氧运动，如快走、游泳、骑行。运动前测血压，血压过高时避免剧烈运动。\n\n定期监测：每天早晚各测一次血压并记录，每3个月复查一次。',
      category: '慢病管理'
    },
    {
      title: '科学减重不反弹：建立健康的生活方式',
      summary: '告别极端节食，用科学方法实现健康减重并长期维持。',
      content: '世界卫生组织指出，超重和肥胖是全球第五大死亡风险因素。科学减重的核心是建立可持续的健康生活方式。\n\n合理饮食：控制总热量摄入，每日减少300-500大卡。保证蛋白质摄入（每公斤体重1.2-1.6克），增加膳食纤维。三餐定时定量，细嚼慢咽。\n\n运动计划：每周3-5次有氧运动，每次40-60分钟。配合每周2-3次力量训练，增加肌肉量提高基础代谢。\n\n行为改变：记录饮食日记，识别情绪性进食。保证充足睡眠，每晚7-8小时。设立阶段性目标，每月减重2-4公斤为宜。',
      category: '体重控制'
    },
    {
      title: '日常生活中的养生小习惯，长寿之人的共同特点',
      summary: '养生不必大费周章，从这几个小习惯开始，让健康融入生活。',
      content: '百岁老人的生活调查发现，长寿者都有一些共同的生活习惯。这些习惯简单易行，任何人都能做到。\n\n早起喝一杯温水——经过一夜睡眠，身体处于脱水状态。一杯温水可以唤醒肠胃，促进新陈代谢。\n\n午间小憩15-20分钟——短暂的午休可以恢复精力，降低心血管疾病风险。注意不要超过30分钟，以免影响夜间睡眠。\n\n坚持八段锦或太极拳——中国传统养生功法柔和缓慢，适合各年龄段练习。每天练习20分钟，可以改善柔韧性、平衡能力和心肺功能。\n\n保持社交活动——孤独感是健康的重要风险因素。每周参与社区活动或与朋友聚会，保持积极乐观的心态。',
      category: '养生保健'
    }
  ];

  await deleteAllNews();

  var results = [];
  for (var i = 0; i < fallbackData.length && i < 10; i++) {
    var item = fallbackData[i];
    var newsItem = {
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category,
      picture: getRandomImageUrl(i),
      date: todayStr,
      publishTime: todayStr,
      views: Math.floor(Math.random() * 300) + 20,
      createdAt: db.serverDate()
    };

    var addResult = await db.collection('health_news').add({ data: newsItem });
    newsItem._id = addResult._id;
    results.push(newsItem);
  }

  return { code: 0, message: '已生成默认资讯(请配置DeepSeek API Key)', count: results.length, data: results };
}
