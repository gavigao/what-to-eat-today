const pool = require('../db/index');
const { AI_DAILY_LIMIT } = require('../config/auth');

// 检查 AI 调用配额（在 AI controller 之前调用）
async function checkAiQuota(req, res, next) {
  const userId = req.user.id;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 确保今天的记录存在（INSERT IGNORE）
  await pool.execute(
    'INSERT IGNORE INTO ai_usage (user_id, usage_date, count) VALUES (?, ?, 0)',
    [userId, dateStr]
  );

  const [rows] = await pool.execute(
    'SELECT count FROM ai_usage WHERE user_id = ? AND usage_date = ?',
    [userId, dateStr]
  );

  const used = rows[0]?.count || 0;

  if (used >= AI_DAILY_LIMIT) {
    return res.status(429).json({
      code: 429,
      data: { limit: AI_DAILY_LIMIT, used },
      message: `今日 AI 调用次数已用完（${AI_DAILY_LIMIT}次/天），请在明天 0 点后重试`,
    });
  }

  // 把当前用量挂在 req 上，后续 controller 可以返回给前端展示
  req.aiQuota = { used, limit: AI_DAILY_LIMIT };
  next();
}

// AI 调用成功后递增计数
async function incrementAiUsage(userId) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  await pool.execute(
    'UPDATE ai_usage SET count = count + 1 WHERE user_id = ? AND usage_date = ?',
    [userId, dateStr]
  );
}

module.exports = { checkAiQuota, incrementAiUsage };
