import { useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { recommendFood } from '../api/index';

const MEAL_TYPES = ['早餐', '午餐', '晚餐'];

export default function AiRecommendPanel({ date, onSelectFood }) {
  const [mealType, setMealType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRecommend = async (type) => {
    setMealType(type);
    setLoading(true);
    setResult(null);
    try {
      const res = await recommendFood(date, type);
      setResult(res.data);
    } catch (err) {
      setResult({ reason: '推荐失败: ' + err.message, foods: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-secondary/10 to-primary/5 rounded-2xl p-4 mb-4 border border-secondary/20">
      <h3 className="text-sm font-semibold text-text-main flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-secondary" />
        AI 推荐今天吃什么
      </h3>
      <p className="text-xs text-text-sub mb-3">
        不知道吃什么？选一顿饭，AI 根据你的营养摄入为你推荐
      </p>

      {/* 选择餐次 */}
      <div className="flex gap-2 mb-3">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleRecommend(type)}
            disabled={loading}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              mealType === type && loading
                ? 'bg-secondary/20 text-secondary'
                : 'bg-white border border-gray-200 text-text-main hover:border-secondary/50'
            }`}
          >
            {mealType === type && loading ? '推荐中...' : `${type}吃什么`}
          </button>
        ))}
      </div>

      {/* 推荐结果 */}
      {result && (
        <div className="space-y-2">
          <p className="text-xs text-text-sub italic">"{result.reason}"</p>
          {result.remaining !== undefined && (
            <p className="text-xs text-text-sub">
              剩余热量预算：<span className="font-semibold text-primary">{Math.round(result.remaining)}</span> / {Math.round(result.targetCal)} kcal
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 mt-2">
            {result.foods.map((food, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 hover:border-secondary/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-main truncate">{food.name}</p>
                  <p className="text-xs text-text-sub truncate">{food.why}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectFood(mealType, food.name)}
                  className="ml-2 shrink-0 flex items-center gap-1 text-xs text-secondary font-medium px-3 py-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                >
                  <Plus size={14} />
                  去添加
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
