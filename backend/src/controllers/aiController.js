const pool = require('../db/index');
const { calcTDEE } = require('./profileController');

// 构建分析 Prompt（含个人画像）
function buildAnalysisPrompt(meals, summary, profile, tdeeData) {
  const mealText = Object.entries(meals)
    .map(([type, foods]) => {
      const foodList = foods.map(f => `${f.food_name}(${f.portion_size})`).join('、');
      return `${type}：${foodList}`;
    })
    .join('\n');

  let profileText = '';
  if (profile && tdeeData) {
    profileText = `\n用户个人画像：
- 性别：${profile.gender}，年龄：${profile.age}岁，身高：${profile.height}cm，当前体重：${profile.weight}kg
- 活动水平：${profile.activity_level}
- 饮食目标：${profile.goal}
- 每日推荐热量摄入：${tdeeData.targetCalories} kcal（基于 TDEE ${tdeeData.tdee} kcal 计算）
- 推荐营养素比例：蛋白质 ${tdeeData.macroRatio.protein.min}-${tdeeData.macroRatio.protein.max}%，碳水 ${tdeeData.macroRatio.carbs.min}-${tdeeData.macroRatio.carbs.max}%，脂肪 ${tdeeData.macroRatio.fat.min}-${tdeeData.macroRatio.fat.max}%
`;
  }

  return `今日饮食记录如下：
${mealText}

营养摄入汇总：
- 总热量：${summary.totalCalories.toFixed(0)} kcal
- 蛋白质：${summary.protein.toFixed(1)} g
- 碳水化合物：${summary.carbs.toFixed(1)} g
- 脂肪：${summary.fat.toFixed(1)} g
${profileText}
请结合以上数据，帮我分析今天吃得是否合理，并给出针对性的改善建议。`;
}

// 调用 DeepSeek API
async function callDeepSeek(messages, maxTokens = 800) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API 调用失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// AI 分析当日饮食
async function analyze(req, res, next) {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 参数' });
    }

    // 查询缓存分析时间
    const [cached] = await pool.execute(
      'SELECT analysis, suggestions, created_at FROM ai_analyses WHERE user_id = 1 AND date = ?',
      [date]
    );

    // 查询最后一次饮食变动时间
    const [mealRows] = await pool.execute(
      'SELECT MAX(created_at) as lastMealTime FROM meals WHERE user_id = 1 AND date = ?',
      [date]
    );

    const lastMealTime = mealRows[0]?.lastMealTime;

    // 若缓存存在且饮食未变化，直接返回缓存
    if (cached.length > 0 && lastMealTime && new Date(lastMealTime) <= new Date(cached[0].created_at)) {
      return res.json({
        code: 200,
        data: { analysis: cached[0].analysis, suggestions: cached[0].suggestions, cached: true },
        message: 'ok',
      });
    }

    // 获取当日饮食数据
    const [meals] = await pool.execute(
      'SELECT meal_type, food_name, portion_size FROM meals WHERE user_id = 1 AND date = ?',
      [date]
    );

    if (meals.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '当日无饮食记录，无法分析' });
    }

    // 分组
    const grouped = {};
    for (const m of meals) {
      if (!grouped[m.meal_type]) grouped[m.meal_type] = [];
      grouped[m.meal_type].push(m);
    }

    // 计算汇总
    const [[summaryRow]] = await pool.execute(
      `SELECT
        COALESCE(SUM(calories), 0) as totalCalories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(carbs), 0) as carbs,
        COALESCE(SUM(fat), 0) as fat
       FROM meals WHERE user_id = 1 AND date = ?`,
      [date]
    );

    // 获取个人画像用于个性化分析
    const [profileRows] = await pool.execute(
      'SELECT gender, age, height, weight, activity_level, goal FROM user_profiles WHERE user_id = 1'
    );
    const profile = profileRows.length > 0 ? profileRows[0] : null;
    const tdeeData = profile ? calcTDEE(profile) : null;

    // 调用 DeepSeek
    const prompt = buildAnalysisPrompt(grouped, summaryRow, profile, tdeeData);
    const systemContent = profile
      ? `你是一位专业的私人营养师，根据用户的个人画像和饮食目标来提供个性化分析。回复使用中文，格式：先给出总体评价（2-3句，需结合用户的目标和推荐热量），再列出3条具体建议（每条不超过40字，尽量具体可执行）。`
      : '你是一位专业的营养师，帮助用户分析每日饮食结构，给出简洁、实用、友好的建议。回复使用中文，格式：先给出总体评价（2-3句），再列出3条具体建议（每条不超过40字）。';
    const aiResponse = await callDeepSeek([
      { role: 'system', content: systemContent },
      { role: 'user', content: prompt },
    ]);

    // 拆分总体评价和建议
    const lines = aiResponse.split('\n').filter(l => l.trim());
    const analysis = lines.slice(0, 2).join('\n') || aiResponse;
    const suggestions = lines.slice(2).join('\n') || '';

    // UPSERT
    await pool.execute(
      `INSERT INTO ai_analyses (user_id, date, analysis, suggestions)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE analysis = VALUES(analysis), suggestions = VALUES(suggestions), created_at = CURRENT_TIMESTAMP`,
      [date, analysis, suggestions]
    );

    res.json({ code: 200, data: { analysis, suggestions, cached: false }, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// 获取已有的 AI 分析
async function getAnalysis(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 参数' });
    }

    const [rows] = await pool.execute(
      'SELECT analysis, suggestions, created_at FROM ai_analyses WHERE user_id = 1 AND date = ?',
      [date]
    );

    if (rows.length === 0) {
      return res.json({ code: 200, data: null, message: '暂无分析' });
    }

    res.json({ code: 200, data: rows[0], message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// AI 估算食物营养数据（食物搜索无结果时的 fallback）
async function estimateFood(req, res, next) {
  try {
    const { foodName } = req.body;
    if (!foodName || !foodName.trim()) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 foodName 参数' });
    }

    const prompt = `请估算"${foodName.trim()}"的营养成分。你必须严格按以下 JSON 格式回复，不要包含任何其他文字：
{
  "calories": 数字(每100g或100ml的热量kcal),
  "protein": 数字(g),
  "carbs": 数字(g),
  "fat": 数字(g),
  "unit": "g"或"ml",
  "serving_size": 数字(通常一份的重量g或体积ml，如鸡蛋一份50g，可乐一罐330ml),
  "serving_desc": "份量描述(如'1个(约50g)'、'1罐(330ml)')"
}`;

    const aiResponse = await callDeepSeek([
      { role: 'system', content: '你是一位专业的营养数据专家。你必须严格按 JSON 格式回复，不要包含任何解释。' },
      { role: 'user', content: prompt },
    ], 300);

    // 解析 AI 返回的 JSON
    let nutrition;
    try {
      // 尝试从回复中提取 JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutrition = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 AI 返回的 JSON');
      }
    } catch {
      return res.status(500).json({ code: 500, data: null, message: 'AI 估算失败，请稍后重试' });
    }

    // 尝试存入食物库（is_custom=1）
    try {
      const [result] = await pool.execute(
        `INSERT INTO foods (name, category, calories, protein, carbs, fat, unit, is_custom, serving_size, serving_desc)
         VALUES (?, '其他', ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          foodName.trim(),
          parseFloat(nutrition.calories).toFixed(2),
          parseFloat(nutrition.protein || 0).toFixed(2),
          parseFloat(nutrition.carbs || 0).toFixed(2),
          parseFloat(nutrition.fat || 0).toFixed(2),
          nutrition.unit || 'g',
          parseFloat(nutrition.serving_size) || 100,
          nutrition.serving_desc || null,
        ]
      );
      nutrition.id = result.insertId;
    } catch {
      // 存储失败不影响返回
      nutrition.id = null;
    }

    const servingSize = parseFloat(nutrition.serving_size) || 100;

    res.json({
      code: 200,
      data: {
        id: nutrition.id,
        name: foodName.trim(),
        category: '其他',
        calories: parseFloat(nutrition.calories).toFixed(2),
        protein: parseFloat(nutrition.protein || 0).toFixed(2),
        carbs: parseFloat(nutrition.carbs || 0).toFixed(2),
        fat: parseFloat(nutrition.fat || 0).toFixed(2),
        unit: nutrition.unit || 'g',
        is_custom: 1,
        serving_size: servingSize,
        serving_desc: nutrition.serving_desc || null,
      },
      message: 'ok',
    });
  } catch (err) {
    next(err);
  }
}

// AI 推荐今日吃什么
async function recommend(req, res, next) {
  try {
    const { date, meal_type } = req.body;
    if (!date || !meal_type) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 或 meal_type 参数' });
    }

    // 获取当日已吃食物
    const [meals] = await pool.execute(
      'SELECT meal_type, food_name, calories FROM meals WHERE user_id = 1 AND date = ?',
      [date]
    );

    // 获取最近7天饮食记录（避免重复推荐）
    const [recentMeals] = await pool.execute(
      'SELECT DISTINCT food_name FROM meals WHERE user_id = 1 AND date >= DATE_SUB(?, INTERVAL 7 DAY)',
      [date]
    );
    const recentFoods = recentMeals.map(r => r.food_name).join('、') || '无';

    // 获取个人画像
    const [profiles] = await pool.execute(
      'SELECT gender, age, height, weight, activity_level, goal FROM user_profiles WHERE user_id = 1'
    );
    const profile = profiles.length > 0 ? profiles[0] : null;
    const tdeeData = profile ? calcTDEE(profile) : null;

    // 计算当日已摄入汇总
    const [[summary]] = await pool.execute(
      'SELECT COALESCE(SUM(calories),0) as totalCalories, COALESCE(SUM(protein),0) as protein, COALESCE(SUM(carbs),0) as carbs, COALESCE(SUM(fat),0) as fat FROM meals WHERE user_id = 1 AND date = ?',
      [date]
    );

    // 剩余预算
    const targetCal = tdeeData ? tdeeData.targetCalories : 2000;
    const remaining = targetCal - summary.totalCalories;

    // 当日已吃食物汇总
    const eatenToday = meals.map(m => `${m.meal_type}:${m.food_name}(${Math.round(m.calories)}kcal)`).join(', ') || '暂无';

    // 获取常见食物供 AI 参考（10 种即可减少 token）
    const [foods] = await pool.execute(
      "SELECT name, category, calories, protein, carbs, fat, serving_size FROM foods WHERE is_custom = 0 ORDER BY RAND() LIMIT 10"
    );
    const foodRef = foods.map(f =>
      `${f.name}(${f.category},${Math.round(f.calories*(f.serving_size/100))}kcal)`
    ).join('、');

    const profileText = profile
      ? `${profile.gender} ${profile.age}岁 ${profile.height}cm ${profile.weight}kg ${profile.activity_level} 目标${profile.goal} 推荐${targetCal}kcal/日`
      : '未设置画像，默认2000kcal/日';

    const prompt = `${profileText}
今日:${eatenToday} 已摄入${Math.round(summary.totalCalories)}kcal(${Math.round(remaining)}kcal剩余) 蛋白${summary.protein.toFixed(1)}g 碳水${summary.carbs.toFixed(1)}g 脂肪${summary.fat.toFixed(1)}g
近7天吃过:${recentFoods}
请为${meal_type}推荐3种食物(从:${foodRef} 中选，避开最近吃过的):
{"reason":"理由","foods":[{"name":"食物名","why":"原因"}]}`;

    const aiResponse = await callDeepSeek([
      { role: 'system', content: '你是一位专业的营养师，根据用户的营养缺口推荐合适的食物。必须严格按 JSON 格式回复。' },
      { role: 'user', content: prompt },
    ], 500);

    let result;
    try {
      const match = aiResponse.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { reason: 'AI 推荐失败', foods: [] };
    } catch {
      result = { reason: 'AI 推荐失败，请重试', foods: [] };
    }

    res.json({ code: 200, data: { ...result, remaining, targetCal }, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

module.exports = { analyze, getAnalysis, estimateFood, recommend };
