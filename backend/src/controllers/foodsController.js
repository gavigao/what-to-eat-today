const pool = require('../db/index');

// 模糊搜索食物（LIKE %q%），返回前10条
async function searchFoods(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ code: 400, data: null, message: '搜索关键词不能为空' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, category, calories, protein, carbs, fat, unit, is_custom FROM foods WHERE name LIKE ? LIMIT 10',
      [`%${q.trim()}%`]
    );

    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// 获取所有分类
async function getCategories(req, res, next) {
  try {
    const categories = [
      '主食', '肉类', '海鲜', '蛋奶', '蔬菜', '水果',
      '豆制品', '坚果', '零食', '饮料', '其他',
    ];
    res.json({ code: 200, data: categories, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// 用户自定义新增食物
async function createFood(req, res, next) {
  try {
    const { name, category, calories, protein, carbs, fat, unit } = req.body;

    // 参数校验
    if (!name || !category || calories == null) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数：name, category, calories' });
    }

    const [result] = await pool.execute(
      'INSERT INTO foods (name, category, calories, protein, carbs, fat, unit, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [
        name.trim(),
        category,
        parseFloat(calories).toFixed(2),
        parseFloat(protein || 0).toFixed(2),
        parseFloat(carbs || 0).toFixed(2),
        parseFloat(fat || 0).toFixed(2),
        unit || 'g',
      ]
    );

    res.json({
      code: 200,
      data: { id: result.insertId, name: name.trim(), category, is_custom: 1 },
      message: '食物添加成功',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchFoods, getCategories, createFood };
