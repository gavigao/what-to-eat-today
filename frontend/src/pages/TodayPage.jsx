import { useState, useEffect, useCallback } from 'react';
import MealCard from '../components/MealCard';
import { getMeals, addMeal, deleteMeal, getSummary } from '../api/index';

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '点心', '零食', '饮料'];

function getTodayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export default function TodayPage() {
  const [date] = useState(getTodayStr());
  const [meals, setMeals] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mealsRes, summaryRes] = await Promise.all([
        getMeals(date),
        getSummary(date),
      ]);
      setMeals(mealsRes.data || {});
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  // 添加食物
  const handleAddMeal = async (mealType, food, portion, customGrams) => {
    const portionCoef = { '少量': 0.25, '半份': 0.5, '一份': 1.0 };
    let calories, protein, carbs, fat;

    if (customGrams) {
      // 自定义克数：按每100g比例直接计算
      const grams = parseFloat(customGrams);
      calories = (food.calories * (grams / 100)).toFixed(2);
      protein = ((food.protein || 0) * (grams / 100)).toFixed(2);
      carbs = ((food.carbs || 0) * (grams / 100)).toFixed(2);
      fat = ((food.fat || 0) * (grams / 100)).toFixed(2);
    } else {
      const ratio = portionCoef[portion] || 1.0;
      const servingRatio = (food.serving_size || 100) / 100;
      calories = (food.calories * servingRatio * ratio).toFixed(2);
      protein = ((food.protein || 0) * servingRatio * ratio).toFixed(2);
      carbs = ((food.carbs || 0) * servingRatio * ratio).toFixed(2);
      fat = ((food.fat || 0) * servingRatio * ratio).toFixed(2);
    }

    try {
      await addMeal({
        date,
        meal_type: mealType,
        food_id: food.id,
        food_name: food.name,
        portion_size: customGrams ? '自定义' : portion,
        calories,
        protein,
        carbs,
        fat,
      });
      await loadData();
    } catch (err) {
      alert('添加失败: ' + err.message);
    }
  };

  // 删除记录
  const handleDeleteMeal = async (id) => {
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      await deleteMeal(id);
      await loadData();
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  // 格式化日期
  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 周${weekDayNames[today.getDay()]}`;

  return (
    <div>
      {/* 日期标题 + 热量概览 */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-text-main">{dateStr}</h2>
        {summary && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-primary">
              {Math.round(summary.totalCalories)}
            </span>
            <span className="text-sm text-text-sub">kcal · 共 {summary.mealCount} 条记录</span>
          </div>
        )}
      </div>

      {/* 餐次卡片网格 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MEAL_TYPES.map((type) => (
            <MealCard
              key={type}
              mealType={type}
              foods={meals[type] || []}
              onAddMeal={handleAddMeal}
              onDeleteMeal={handleDeleteMeal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
