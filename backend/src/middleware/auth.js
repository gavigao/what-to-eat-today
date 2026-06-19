const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../config/auth');

// JWT 认证中间件：从 Authorization header 解析 token，注入 req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, data: null, message: '请先登录' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { id: payload.sub, role: payload.role, username: payload.username };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, data: null, message: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, data: null, message: '无效的登录凭证' });
  }
}

// 可选认证：有 token 就解析，没有也放行（用于公开接口）
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.split(' ')[1], ACCESS_TOKEN_SECRET);
      req.user = { id: payload.sub, role: payload.role, username: payload.username };
    } catch {
      // token 无效也放行，只是不设置 req.user
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
