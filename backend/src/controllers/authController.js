const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/index');
const {
  ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_DAYS, BCRYPT_ROUNDS,
} = require('../config/auth');

// 生成 access token
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// 生成 refresh token（存数据库）
async function generateRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return token;
}

// 校验邀请码（原子递增）
async function validateAndUseInviteCode(code) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      'SELECT * FROM invite_codes WHERE code = ? FOR UPDATE',
      [code]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return { valid: false, message: '邀请码不存在' };
    }

    const invite = rows[0];
    if (!invite.is_active) {
      await conn.rollback();
      return { valid: false, message: '邀请码已失效' };
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await conn.rollback();
      return { valid: false, message: '邀请码已过期' };
    }
    if (invite.current_uses >= invite.max_uses) {
      await conn.rollback();
      return { valid: false, message: '邀请码已被用完' };
    }

    await conn.execute(
      'UPDATE invite_codes SET current_uses = current_uses + 1 WHERE code = ?',
      [code]
    );

    await conn.commit();
    return { valid: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { username, password, email, inviteCode } = req.body;

    if (!username || !password || !inviteCode) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数：username, password, inviteCode' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, data: null, message: '密码至少6位' });
    }

    // 校验邀请码
    const result = await validateAndUseInviteCode(inviteCode);
    if (!result.valid) {
      return res.status(400).json({ code: 400, data: null, message: result.message });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, data: null, message: '用户名已被注册' });
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [insertResult] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email || null, passwordHash]
    );

    const user = { id: insertResult.insertId, username, role: 'user' };
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(201).json({
      code: 201,
      data: { accessToken, refreshToken, user: { id: user.id, username: user.username, role: user.role } },
      message: '注册成功',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: '请输入用户名和密码' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      [username]
    );

    // 用户不存在或密码错误，统一返回（防止用户枚举）
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ code: 401, data: null, message: '用户名或密码错误' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      code: 200,
      data: { accessToken, refreshToken, user: { id: user.id, username: user.username, role: user.role } },
      message: '登录成功',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 refreshToken' });
    }

    // 查找有效的 refresh token
    const [rows] = await pool.execute(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.username, u.role
       FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id
       WHERE rt.token = ?`,
      [refreshToken]
    );

    if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) {
      return res.status(401).json({ code: 401, data: null, message: 'refresh token 无效或已过期，请重新登录' });
    }

    const { user_id, username, role } = rows[0];

    // 轮换：删除旧 token，生成新 token
    await pool.execute('DELETE FROM refresh_tokens WHERE id = ?', [rows[0].id]);

    const user = { id: user_id, username, role };
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user_id);

    res.json({
      code: 200,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken, user },
      message: 'ok',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    res.json({ code: 200, data: null, message: '已退出登录' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/auth/account — 修改用户名/密码（需验证当前密码）
async function updateAccount(req, res, next) {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const userId = req.user.id;

    // 获取当前用户信息
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    // 验证当前密码
    const match = await bcrypt.compare(currentPassword || '', user.password_hash);
    if (!match) {
      return res.status(400).json({ code: 400, data: null, message: '当前密码错误' });
    }

    // 改用户名
    if (newUsername && newUsername !== user.username) {
      const [dup] = await pool.execute('SELECT id FROM users WHERE username = ?', [newUsername]);
      if (dup.length > 0) {
        return res.status(409).json({ code: 409, data: null, message: '用户名已被占用' });
      }
      await pool.execute('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
    }

    // 改密码
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ code: 400, data: null, message: '新密码至少6位' });
      }
      const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    }

    res.json({ code: 200, data: { username: newUsername || user.username }, message: '账号信息已更新' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, updateAccount };
