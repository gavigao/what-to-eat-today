// JWT 认证配置
module.exports = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'what-to-eat-dev-access-secret-change-in-production',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'what-to-eat-dev-refresh-secret-change-in-production',
  ACCESS_TOKEN_EXPIRY: '2h',       // access token 2小时过期
  REFRESH_TOKEN_EXPIRY_DAYS: 7,    // refresh token 7天过期
  BCRYPT_ROUNDS: 12,               // bcrypt 加密轮数
  AI_DAILY_LIMIT: parseInt(process.env.AI_DAILY_LIMIT, 10) || 15,  // AI 每日调用上限
};
