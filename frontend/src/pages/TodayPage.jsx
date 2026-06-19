import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import MealCard from '../components/MealCard';
import AiRecommendPanel from '../components/AiRecommendPanel';
import { getMeals, addMeal, deleteMeal, getSummary } from '../api/index';
import { getMyFamily, getFamilyMemberMeals } from '../api/family';

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '零食', '饮料'];
const MEAL_COLORS = {
  '早餐': { color: '#FBBF24', icon: '🌅' },
  '午餐': { color: '#FF6B35', icon: '☀️' },
  '晚餐': { color: '#6366F1', icon: '🌙' },
  '零食': { color: '#F472B6', icon: '🍪' },
  '饮料': { color: '#38BDF8', icon: '💧' },
};
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

// 合并所有家庭的成员并去重
function mergeFamilyMembers(families, myId) {
  const seen = new Set([myId]);
  const merged = [];
  for (const f of families) {
    for (const m of f.members || []) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        merged.push(m);
      }
    }
  }
  return merged;
}

export default function TodayPage() {
  const [date, setDate] = useState(getTodayStr());
  const [meals, setMeals] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendTrigger, setRecommendTrigger] = useState(null);

  // 家庭相关
  const [familyMembers, setFamilyMembers] = useState([]);
  const [viewingMember, setViewingMember] = useState(null); // null=看自己

  // 加载家庭列表
  useEffect(() => {
    getMyFamily()
      .then((families) => setFamilyMembers(mergeFamilyMembers(Array.isArray(families) ? families : [], null)))
      .catch(() => {});
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewingMember) {
        // 看家人的饮食
        const res = await getFamilyMemberMeals(viewingMember.id, date);
        setMeals(res.data || {});
        // 计算汇总
        let totalCal = 0, mealCount = 0;
        for (const [, foods] of Object.entries(res.data || {})) {
          for (const f of foods) { totalCal += f.calories || 0; mealCount++; }
        }
        setSummary({ totalCalories: totalCal, mealCount });
      } else {
        const [mealsRes, summaryRes] = await Promise.all([
          getMeals(date),
          getSummary(date),
        ]);
        setMeals(mealsRes.data || {});
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  }, [date, viewingMember]);

  useEffect(() => { loadData(); }, [loadData]);

  // 添加食物（仅自己）
  const handleAddMeal = async (mealType, food, portion, customGrams) => {
    if (viewingMember) return;
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
      await addMeal({ date, meal_type: mealType, food_id: food.id, food_name: food.name, portion_size: customGrams ? '自定义' : portion, calories, protein, carbs, fat });
      await loadData();
    } catch (err) {
      alert('添加失败: ' + err.message);
    }
  };

  // 删除记录（仅自己）
  const handleDeleteMeal = async (id) => {
    if (viewingMember) return;
    if (!confirm('确定删除这条记录吗？')) return;
    try {
      await deleteMeal(id);
      await loadData();
    } catch (err) {
      alert('删除失败: ' + err.message);
    }
  };

  const todayStr = getTodayStr();
  const isViewingOther = viewingMember !== null;

  return (
    <div>
      {/* 日期选择器 */}
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={() => setDate(shiftDate(date, -1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} className="text-text-sub" />
        </button>
        <div className="relative flex-1 flex items-center justify-center gap-2">
          <span className="text-sm font-semibold text-text-main">{formatDateLabel(date)}</span>
          <div className="relative">
            <Calendar size={16} className="text-text-sub cursor-pointer" />
            <input type="date" value={date} max={todayStr} onChange={(e) => setDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        <button type="button" onClick={() => { const next = shiftDate(date, 1); if (next <= todayStr) setDate(next); }} disabled={date >= todayStr} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30">
          <ChevronRight size={20} className="text-text-sub" />
        </button>
      </div>

      {/* 家人选择栏 */}
      {familyMembers.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setViewingMember(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !isViewingOther ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub hover:bg-gray-200'
            }`}
          >
            👤 我
          </button>
          <span className="text-text-sub mx-0.5">·</span>
          {familyMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setViewingMember(m)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                viewingMember?.id === m.id ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub hover:bg-gray-200'
              }`}
            >
              👤 {m.username}
            </button>
          ))}
        </div>
      )}

      {/* 热量概览 */}
      {summary && (
        <div className="flex items-center gap-3 mb-4 animate-count">
          <span className="stat-number" style={{ fontSize: 32, color: '#FF6B35' }}>{Math.round(summary.totalCalories)}</span>
          <span className="text-sm text-text-sub" style={{ fontSize: 16 }}>
            kcal · 共 {summary.mealCount} 条记录
            {isViewingOther && <span className="text-primary ml-1">· {viewingMember.username}</span>}
          </span>
          {date !== todayStr && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">补录</span>}
        </div>
      )}

      {/* 整日无记录提示 */}
      {!loading && summary && summary.mealCount === 0 && (
        <div className="rounded-2xl p-4 mb-4 card-shadow text-center" style={{ background: '#FFF8F5' }}>
          <p className="text-sm font-medium" style={{ color: '#FF6B35' }}>
            {isViewingOther ? `${viewingMember.username} 今天还没有记录` : '今天还没有记录，开始添加第一餐吧 🍳'}
          </p>
        </div>
      )}

      {/* AI 推荐面板（仅自己） */}
      {!isViewingOther && (
        <AiRecommendPanel
          date={date}
          onSelectFood={(mealType, foodName) => setRecommendTrigger({ mealType, foodName, time: Date.now() })}
        />
      )}

      {/* 餐次卡片网格 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MEAL_TYPES.map((type) => (
            <MealCard
              key={type}
              mealType={type}
              foods={meals[type] || []}
              onAddMeal={isViewingOther ? () => {} : handleAddMeal}
              onDeleteMeal={isViewingOther ? () => {} : handleDeleteMeal}
              recommendTrigger={isViewingOther ? null : recommendTrigger}
              mealColor={MEAL_COLORS[type]?.color}
              mealIcon={MEAL_COLORS[type]?.icon}
              readOnly={isViewingOther}
            />
          ))}
        </div>
      )}
    </div>
  );
}
