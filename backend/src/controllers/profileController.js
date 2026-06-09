const pool = require('../db/index');

// 活动系数映射
const ACTIVITY_FACTOR = {
  '久坐': 1.2,
  '轻度活动': 1.375,
  '中度活动': 1.55,
  '重度活动': 1.725,
  '运动员': 1.9,
};

// 饮食目标热量调整
const GOAL_ADJUST = {
  '减脂': -400,
  '维持体重': 0,
  '增肌': 300,
};

// 营养素推荐比例
const MACRO_RATIO = {
  '减脂': { protein: { min: 25, max: 35 }, carbs: { min: 35, max: 45 }, fat: { min: 20, max: 30 } },
  '维持体重': { protein: { min: 15, max: 20 }, carbs: { min: 55, max: 65 }, fat: { min: 20, max: 30 } },
  '增肌': { protein: { min: 20, max: 30 }, carbs: { min: 45, max: 55 }, fat: { min: 20, max: 30 } },
};

// 计算 BMR（Mifflin-St Jeor 公式）
function calcBMR(gender, weight, height, age) {
  if (gender === '男') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

// 计算 TDEE
function calcTDEE(profile) {
  const bmr = calcBMR(profile.gender, profile.weight, profile.height, profile.age);
  const tdee = bmr * (ACTIVITY_FACTOR[profile.activity_level] || 1.2);
  const target = tdee + (GOAL_ADJUST[profile.goal] || 0);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(target),
    macroRatio: MACRO_RATIO[profile.goal] || MACRO_RATIO['维持体重'],
  };
}

// 获取个人画像
async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT gender, age, height, weight, activity_level, goal, updated_at FROM user_profiles WHERE user_id = 1'
    );
    if (rows.length === 0) {
      return res.json({ code: 200, data: null, message: '未设置个人画像' });
    }
    const profile = rows[0];
    const tdeeData = calcTDEE(profile);
    res.json({ code: 200, data: { ...profile, ...tdeeData }, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// 创建或更新个人画像
async function updateProfile(req, res, next) {
  try {
    const { gender, age, height, weight, activity_level, goal } = req.body;

    if (!gender || !age || !height || !weight) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数：gender, age, height, weight' });
    }

    // 记录体重日志
    await pool.execute(
      'INSERT INTO weight_logs (user_id, date, weight) VALUES (1, CURDATE(), ?) ON DUPLICATE KEY UPDATE weight = VALUES(weight)',
      [parseFloat(weight).toFixed(1)]
    );

    // UPSERT 画像
    await pool.execute(
      `INSERT INTO user_profiles (user_id, gender, age, height, weight, activity_level, goal)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE gender=VALUES(gender), age=VALUES(age), height=VALUES(height),
                               weight=VALUES(weight), activity_level=VALUES(activity_level), goal=VALUES(goal)`,
      [gender, parseInt(age), parseFloat(height), parseFloat(weight), activity_level || '久坐', goal || '维持体重']
    );

    const profile = { gender, age: parseInt(age), height: parseFloat(height), weight: parseFloat(weight), activity_level: activity_level || '久坐', goal: goal || '维持体重' };
    const tdeeData = calcTDEE(profile);

    res.json({ code: 200, data: { ...profile, ...tdeeData }, message: '个人画像更新成功' });
  } catch (err) {
    next(err);
  }
}

// 获取体重日志
async function getWeightLog(req, res, next) {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const [rows] = await pool.execute(
      'SELECT date, weight FROM weight_logs WHERE user_id = 1 AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY date ASC',
      [days]
    );
    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getWeightLog, calcTDEE, ACTIVITY_FACTOR, GOAL_ADJUST, MACRO_RATIO };
