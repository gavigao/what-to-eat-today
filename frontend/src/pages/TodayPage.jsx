import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import MealCard from '../components/MealCard';
import AiRecommendPanel from '../components/AiRecommendPanel';
import { getMeals, addMeal, deleteMeal, getSummary } from '../api/index';

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '点心', '零食', '饮料'];
const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr) {
  const today = getTodayStr();
  const d = new Date(dateStr + 'T00:00:00');
  const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekDayNames[d.getDay()]}`;
  if (dateStr === today) return label + '（今天）';
  return label;
}

export default function TodayPage() {
  const [date, setDate] = useState(getTodayStr());
  const [meals, setMeals] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendTrigger, setRecommendTrigger] = useState(null);

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

  const todayStr = getTodayStr();

  return (
    <div>
      {/* 日期选择器 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setDate(shiftDate(date, -1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} className="text-text-sub" />
        </button>

        <div className="relative flex-1 flex items-center justify-center gap-2">
          <span className="text-sm font-semibold text-text-main">
            {formatDateLabel(date)}
          </span>
          <div className="relative">
            <Calendar size={16} className="text-text-sub cursor-pointer" />
            <input
              type="date"
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = shiftDate(date, 1);
            if (next <= todayStr) setDate(next);
          }}
          disabled={date >= todayStr}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={20} className="text-text-sub" />
        </button>
      </div>

      {/* 热量概览 */}
      {summary && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold text-primary">
            {Math.round(summary.totalCalories)}
          </span>
          <span className="text-sm text-text-sub">kcal · 共 {summary.mealCount} 条记录</span>
          {date !== todayStr && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">补录</span>
          )}
        </div>
      )}

      {/* AI 推荐面板 */}
      <AiRecommendPanel
        date={date}
        onSelectFood={(mealType, foodName) => {
          setRecommendTrigger({ mealType, foodName, time: Date.now() });
        }}
      />

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
              recommendTrigger={recommendTrigger}
            />
          ))}
        </div>
      )}
    </div>
  );
}
