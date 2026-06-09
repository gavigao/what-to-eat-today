import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { searchFoods, estimateFood } from '../api/index';
import PortionSelector from './PortionSelector';

export default function FoodSearch({ onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('一份');
  const [showAiFallback, setShowAiFallback] = useState(false);
  const [aiEstimating, setAiEstimating] = useState(false);
  const timerRef = useRef(null);

  // 防抖搜索 300ms
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowAiFallback(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchFoods(query.trim());
        const list = res.data || [];
        setResults(list);
        setShowAiFallback(list.length === 0);
      } catch {
        setResults([]);
        setShowAiFallback(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // AI 估算食物
  const handleAiEstimate = async () => {
    if (!query.trim()) return;
    setAiEstimating(true);
    try {
      const res = await estimateFood(query.trim());
      const food = res.data;
      setResults([food]);
      setSelectedFood(food);
      setShowAiFallback(false);
    } catch {
      alert('AI 估算失败，请稍后重试');
    } finally {
      setAiEstimating(false);
    }
  };

  // 选中食物
  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setPortion('一份');
  };

  // 确认添加
  const handleConfirm = () => {
    if (!selectedFood) return;
    onAdd({ food: selectedFood, portion });
    setSelectedFood(null);
    setPortion('一份');
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="drawer-overlay fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* 抽屉 */}
      <div className="drawer-content fixed inset-x-0 bottom-0 max-h-[80vh] bg-white rounded-t-2xl z-50 flex flex-col shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-text-main">添加食物</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={22} className="text-text-sub" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索食物名称..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>
        </div>

        {/* 搜索结果列表 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((food) => {
                const isSelected = selectedFood?.id === food.id && selectedFood?.name === food.name;
                return (
                  <div key={food.id || food.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectFood(food)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-main">{food.name}</span>
                        <span className="text-sm text-primary font-semibold">
                          {food.calories} kcal/100{food.unit || 'g'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-sub">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{food.category}</span>
                        {food.is_custom === 1 && (
                          <span className="text-secondary font-medium">AI 估算</span>
                        )}
                      </div>
                    </button>

                    {/* 份量选择 */}
                    {isSelected && (
                      <div className="mt-2 mb-3 px-1">
                        <PortionSelector value={portion} onChange={setPortion} />
                        <button
                          type="button"
                          onClick={handleConfirm}
                          className="w-full mt-3 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                          确认添加 · 约{(food.calories * (portion === '少量' ? 0.25 : portion === '半份' ? 0.5 : portion === '多份' ? 1.5 : 1)).toFixed(0)} kcal
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && !showAiFallback && (
            <p className="text-center text-text-sub py-8">未找到结果</p>
          )}

          {/* AI 估算入口 */}
          {showAiFallback && query.trim() && (
            <div className="text-center py-6">
              <p className="text-text-sub mb-3">未在食物库中找到「{query.trim()}」</p>
              <button
                type="button"
                onClick={handleAiEstimate}
                disabled={aiEstimating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary/10 text-secondary font-medium rounded-xl hover:bg-secondary/20 transition-colors disabled:opacity-50"
              >
                <Sparkles size={18} />
                {aiEstimating ? 'AI 估算中...' : '让 AI 帮我估算这个食物'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
