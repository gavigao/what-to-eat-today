const crypto = require('crypto');
const pool = require('../db/index');

// GET /api/admin/users — 用户列表
async function listUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT id, username, email, role, created_at
       FROM users ORDER BY id ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[totalRow]] = await pool.execute('SELECT COUNT(*) as total FROM users');

    res.json({
      code: 200,
      data: { users: rows, total: totalRow.total, page, limit },
      message: 'ok',
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id — 删除用户
async function deleteUser(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);

    // 不能删自己
    if (targetId === req.user.id) {
      return res.status(400).json({ code: 400, data: null, message: '不能删除自己' });
    }

    // 检查是否是最后一个 admin
    const [targetUser] = await pool.execute('SELECT role FROM users WHERE id = ?', [targetId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' });
    }
    if (targetUser[0].role === 'admin') {
      const [adminCount] = await pool.execute('SELECT COUNT(*) as cnt FROM users WHERE role = ?', ['admin']);
      if (adminCount[0].cnt <= 1) {
        return res.status(400).json({ code: 400, data: null, message: '不能删除最后一个管理员' });
      }
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [targetId]);

    res.json({ code: 200, data: null, message: '用户已删除' });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/invite-codes — 生成邀请码
async function generateInviteCodes(req, res, next) {
  try {
    const count = Math.min(parseInt(req.body.count, 10) || 1, 50);
    const maxUses = parseInt(req.body.maxUses, 10) || 1;
    const expiresAt = req.body.expiresAt || null;

    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8位
      await pool.execute(
        'INSERT INTO invite_codes (code, max_uses, created_by, expires_at) VALUES (?, ?, ?, ?)',
        [code, maxUses, req.user.id, expiresAt]
      );
      codes.push({ code, maxUses, expiresAt });
    }

    res.json({ code: 200, data: codes, message: `已生成 ${count} 个邀请码` });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/invite-codes — 邀请码列表
async function listInviteCodes(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT ic.*, u.username as creator_name
       FROM invite_codes ic LEFT JOIN users u ON ic.created_by = u.id
       ORDER BY ic.created_at DESC`
    );

    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/invite-codes/:id/deactivate — 停用邀请码
async function deactivateInviteCode(req, res, next) {
  try {
    const codeId = parseInt(req.params.id, 10);
    const [result] = await pool.execute(
      'UPDATE invite_codes SET is_active = 0 WHERE id = ?',
      [codeId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, data: null, message: '邀请码不存在' });
    }
    res.json({ code: 200, data: null, message: '邀请码已停用' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, deleteUser, generateInviteCodes, listInviteCodes, deactivateInviteCode };
