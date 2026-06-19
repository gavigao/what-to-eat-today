const crypto = require('crypto');
const pool = require('../db/index');

// 生成 6 位随机配对码
function generatePairingCode() {
  return String(crypto.randomInt(100000, 999999));
}

// POST /api/family/create — 创建家庭
async function createFamily(req, res, next) {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ code: 400, data: null, message: '请输入家庭名称' });
    }

    // 生成唯一配对码
    let pairingCode;
    let attempts = 0;
    while (attempts < 10) {
      pairingCode = generatePairingCode();
      const [dup] = await pool.execute('SELECT id FROM families WHERE pairing_code = ?', [pairingCode]);
      if (dup.length === 0) break;
      attempts++;
    }
    if (attempts >= 10) {
      return res.status(500).json({ code: 500, data: null, message: '生成配对码失败，请重试' });
    }

    // 创建家庭
    const [familyResult] = await pool.execute(
      'INSERT INTO families (name, pairing_code, created_by) VALUES (?, ?, ?)',
      [name.trim(), pairingCode, req.user.id]
    );

    // 创始人加入
    await pool.execute(
      'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
      [familyResult.insertId, req.user.id, 'owner']
    );

    res.json({
      code: 200,
      data: { familyId: familyResult.insertId, name: name.trim(), pairingCode },
      message: '家庭创建成功',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/family/join — 加入家庭（配对码）
async function joinFamily(req, res, next) {
  try {
    const { pairingCode } = req.body;
    if (!pairingCode) {
      return res.status(400).json({ code: 400, data: null, message: '请输入配对码' });
    }

    // 查找家庭
    const [families] = await pool.execute(
      'SELECT id, name FROM families WHERE pairing_code = ?',
      [pairingCode]
    );
    if (families.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '配对码无效' });
    }

    // 检查是否已在同一家庭中
    const [existing] = await pool.execute(
      'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
      [families[0].id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, data: null, message: '你已在这个家庭中' });
    }

    // 加入
    await pool.execute(
      'INSERT INTO family_members (family_id, user_id) VALUES (?, ?)',
      [families[0].id, req.user.id]
    );

    res.json({
      code: 200,
      data: { familyId: families[0].id, familyName: families[0].name },
      message: '加入家庭成功',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/family/mine — 获取我加入的所有家庭
async function getMyFamily(req, res, next) {
  try {
    // 获取我加入的所有家庭 ID
    const [myFamilies] = await pool.execute(
      'SELECT family_id FROM family_members WHERE user_id = ?',
      [req.user.id]
    );

    if (myFamilies.length === 0) {
      return res.json({ code: 200, data: [], message: '尚未加入家庭' });
    }

    const familyIds = myFamilies.map(f => f.family_id);

    // 获取所有家庭的信息
    const [familyRows] = await pool.execute(
      `SELECT f.id, f.name, f.pairing_code, f.created_at, u.username as owner_name
       FROM families f
       JOIN family_members fm ON f.id = fm.family_id AND fm.role = 'owner'
       JOIN users u ON fm.user_id = u.id
       WHERE f.id IN (${familyIds.map(() => '?').join(',')})`,
      familyIds
    );

    // 获取每个家庭的成员
    const [allMembers] = await pool.execute(
      `SELECT fm.family_id, u.id, u.username, fm.role, fm.joined_at
       FROM family_members fm
       JOIN users u ON fm.user_id = u.id
       WHERE fm.family_id IN (${familyIds.map(() => '?').join(',')})
       ORDER BY fm.joined_at ASC`,
      familyIds
    );

    // 按家庭分组
    const families = familyRows.map(f => ({
      ...f,
      members: allMembers
        .filter(m => m.family_id === f.id)
        .map(m => ({
          id: m.id,
          username: m.username,
          role: m.role,
          joinedAt: m.joined_at,
        })),
    }));

    res.json({ code: 200, data: families, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// POST /api/family/:familyId/leave — 退出指定家庭
async function leaveFamily(req, res, next) {
  try {
    const familyId = parseInt(req.params.familyId, 10);

    const [existing] = await pool.execute(
      'SELECT fm.role FROM family_members fm WHERE fm.family_id = ? AND fm.user_id = ?',
      [familyId, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '你不在这个家庭中' });
    }

    const { role } = existing[0];

    if (role === 'owner') {
      // 找最早加入的其他成员
      const [others] = await pool.execute(
        'SELECT user_id FROM family_members WHERE family_id = ? AND user_id != ? ORDER BY joined_at ASC LIMIT 1',
        [familyId, req.user.id]
      );
      if (others.length > 0) {
        // 转移 owner
        await pool.execute(
          'UPDATE family_members SET role = ? WHERE family_id = ? AND user_id = ?',
          ['owner', familyId, others[0].user_id]
        );
      } else {
        // 没有其他成员，解散家庭
        await pool.execute('DELETE FROM families WHERE id = ?', [familyId]);
      }
    }

    // 删除成员记录
    await pool.execute('DELETE FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, req.user.id]);

    res.json({ code: 200, data: null, message: '已退出家庭' });
  } catch (err) {
    next(err);
  }
}

// GET /api/family/members/:userId/meals — 查看家庭成员的饮食记录
async function getFamilyMemberMeals(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 参数' });
    }

    // 验证两人属于同一个家庭（任意一个）
    const [sameFamily] = await pool.execute(
      `SELECT 1 FROM family_members
       WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = ?)
       AND user_id = ?`,
      [req.user.id, targetUserId]
    );
    if (sameFamily.length === 0) {
      return res.status(403).json({ code: 403, data: null, message: '只能查看家庭成员的饮食记录' });
    }

    // 查询饮食记录
    const [rows] = await pool.execute(
      `SELECT id, meal_type, food_name, portion_size, calories
       FROM meals WHERE user_id = ? AND date = ?
       ORDER BY FIELD(meal_type, '早餐','午餐','晚餐','零食','饮料'), created_at ASC`,
      [targetUserId, date]
    );

    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.meal_type]) grouped[row.meal_type] = [];
      grouped[row.meal_type].push(row);
    }

    res.json({ code: 200, data: grouped, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createFamily, joinFamily, getMyFamily, leaveFamily, getFamilyMemberMeals };
