const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const {
    userId,
    xingming, xingbie, nianling, xuexing,
    shengao, tizhong, bmi,
    guominshi, jibingshi, jiankangzhuangkuang,
    xiyan, yinjiul, yundong, shuimian, yinshi,
    jiazu_bingshi, jiazu_gaoxueya, jiazu_tangniaobing, jiazu_xinzang, jiazu_qita,
    jinji_lianxiren, jinji_dianhua, jinji_yibao, jinjicheng_duixiang,
    yongyao_leixing, yongyao_mingcheng, yongyao_guomin,
    recordDate
  } = event;

  try {
    if (!userId) {
      return { code: -1, message: '用户ID不能为空' };
    }

    const height = parseFloat(shengao) || 0;
    const weight = parseFloat(tizhong) || 0;
    const bmiValue = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : 0;

    const record = await db.collection('health_records').add({
      data: {
        userId,
        xingming,
        xingbie,
        nianling: parseInt(nianling) || 0,
        xuexing,
        shengao: height,
        tizhong: weight,
        bmi: parseFloat(bmiValue),
        guominshi,
        jibingshi,
        jiankangzhuangkuang,
        xiyan,
        yinjiul,
        yundong,
        shuimian,
        yinshi,
        jiazu_bingshi,
        jiazu_gaoxueya,
        jiazu_tangniaobing,
        jiazu_xinzang,
        jiazu_qita,
        jinji_lianxiren,
        jinji_dianhua,
        jinji_yibao,
        jinjicheng_duixiang,
        yongyao_leixing,
        yongyao_mingcheng,
        yongyao_guomin,
        recordDate: recordDate || new Date().toISOString().split('T')[0],
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '添加成功',
      data: { _id: record._id, userId }
    };
  } catch (err) {
    return { code: -1, message: '添加失败', error: err.message };
  }
};