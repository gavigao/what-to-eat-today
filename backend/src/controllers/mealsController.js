const pool = require('../db/index');

// 份量系数映射
const PORTION_RATIO = {
  '少量': 0.25,
  '半份': 0.5,
  '一份': 1.0,
  '多份': 1.5,
};

// 获取指定日期的全部记录（按meal_type分组）
async function getMeals(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 参数' });
    }

    const [rows] = await pool.execute(
      `SELECT id, user_id, date, meal_type, food_id, food_name, portion_size,
              calories, protein, carbs, fat, notes, created_at
       FROM meals WHERE user_id = 1 AND date = ? ORDER BY created_at ASC`,
      [date]
    );

    // 按 meal_type 分组
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

// 新增一条饮食记录
async function createMeal(req, res, next) {
  try {
    const { date, meal_type, food_id, food_name, portion_size, notes } = req.body;

    if (!date || !meal_type || !food_name) {
      return res.status(400).json({ code: 400, data: null, message: '缺少必填参数：date, meal_type, food_name' });
    }

    const portion = portion_size || '一份';
    let calories, protein, carbs, fat;

    // 如果有 food_id，从 foods 表获取营养数据并乘以份量系数
    if (food_id) {
      const [foods] = await pool.execute('SELECT calories, protein, carbs, fat FROM foods WHERE id = ?', [food_id]);
      if (foods.length === 0) {
        return res.status(400).json({ code: 400, data: null, message: '食物不存在' });
      }
      const ratio = PORTION_RATIO[portion] || 1.0;
      calories = (foods[0].calories * ratio).toFixed(2);
      protein = (foods[0].protein * ratio).toFixed(2);
      carbs = (foods[0].carbs * ratio).toFixed(2);
      fat = (foods[0].fat * ratio).toFixed(2);
    } else {
      // AI 估算的自定义食物，直接使用传入的数值
      calories = parseFloat(req.body.calories || 0).toFixed(2);
      protein = parseFloat(req.body.protein || 0).toFixed(2);
      carbs = parseFloat(req.body.carbs || 0).toFixed(2);
      fat = parseFloat(req.body.fat || 0).toFixed(2);
    }

    const [result] = await pool.execute(
      `INSERT INTO meals (user_id, date, meal_type, food_id, food_name, portion_size, calories, protein, carbs, fat, notes)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, meal_type, food_id || null, food_name, portion, calories, protein, carbs, fat, notes || null]
    );

    res.json({
      code: 200,
      data: {
        id: result.insertId,
        date, meal_type, food_id: food_id || null, food_name,
        portion_size: portion, calories: parseFloat(calories),
        protein: parseFloat(protein), carbs: parseFloat(carbs), fat: parseFloat(fat),
      },
      message: '记录添加成功',
    });
  } catch (err) {
    next(err);
  }
}

// 删除一条记录
async function deleteMeal(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM meals WHERE id = ? AND user_id = 1', [id]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ code: 400, data: null, message: '记录不存在' });
    }

    res.json({ code: 200, data: null, message: '删除成功' });
  } catch (err) {
    next(err);
  }
}

// 获取指定日期的营养汇总
async function getSummary(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 参数' });
    }

    const [rows] = await pool.execute(
      `SELECT
        COALESCE(SUM(calories), 0) as totalCalories,
        COALESCE(SUM(protein), 0) as protein,
        COALESCE(SUM(carbs), 0) as carbs,
        COALESCE(SUM(fat), 0) as fat,
        COUNT(*) as mealCount
       FROM meals WHERE user_id = 1 AND date = ?`,
      [date]
    );

    res.json({
      code: 200,
      data: {
        totalCalories: parseFloat(rows[0].totalCalories.toFixed(1)),
        protein: parseFloat(rows[0].protein.toFixed(1)),
        carbs: parseFloat(rows[0].carbs.toFixed(1)),
        fat: parseFloat(rows[0].fat.toFixed(1)),
        mealCount: rows[0].mealCount,
      },
      message: 'ok',
    });
  } catch (err) {
    next(err);
  }
}

// 获取近N天每日热量趋势
async function getTrend(req, res, next) {
  try {
    const days = parseInt(req.query.days, 10) || 7;

    const [rows] = await pool.execute(
      `SELECT date, SUM(calories) as totalCalories
       FROM meals WHERE user_id = 1 AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY date ORDER BY date ASC`,
      [days]
    );

    res.json({ code: 200, data: rows, message: 'ok' });
  } catch (err) {
    next(err);
  }
}

// 获取指定月份的每日汇总（历史记录页用）
async function getMonthly(req, res, next) {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 year 或 month 参数' });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`; // MySQL 会自动截断到有效日期

    // 查询该月所有有记录的日子
    const [rows] = await pool.execute(
      `SELECT date, SUM(calories) as totalCalories, COUNT(*) as mealCount
       FROM meals WHERE user_id = 1 AND date >= ? AND date <= ?
       GROUP BY date ORDER BY date DESC`,
      [startDate, endDate]
    );

    // 计算月度统计
    const daysWithRecords = rows.length;
    const totalCal = rows.reduce((s, r) => s + parseFloat(r.totalCalories), 0);
    const avgCal = daysWithRecords > 0 ? totalCal / daysWithRecords : 0;
    const maxCal = rows.length > 0 ? Math.max(...rows.map(r => parseFloat(r.totalCalories))) : 0;

    res.json({
      code: 200,
      data: {
        days: rows.map(r => ({
          date: r.date,
          totalCalories: parseFloat(r.totalCalories),
          mealCount: r.mealCount,
        })),
        stats: {
          daysWithRecords,
          avgCalories: parseFloat(avgCal.toFixed(0)),
          maxCalories: parseFloat(maxCal.toFixed(0)),
        },
      },
      message: 'ok',
    });
  } catch (err) {
    next(err);
  }
}

// 获取指定日期所有食物的详细列表（用于历史记录展开）
async function getMealDetails(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ code: 400, data: null, message: '缺少 date 参数' });
    }

    const [rows] = await pool.execute(
      `SELECT id, meal_type, food_name, portion_size, calories
       FROM meals WHERE user_id = 1 AND date = ? ORDER BY FIELD(meal_type, '早餐','午餐','晚餐','点心','零食','饮料'), created_at ASC`,
      [date]
    );

    // 按 meal_type 分组
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

module.exports = { getMeals, createMeal, deleteMeal, getSummary, getTrend, getMonthly, getMealDetails };
