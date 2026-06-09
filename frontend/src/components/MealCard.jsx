import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FoodSearch from './FoodSearch';

export default function MealCard({ mealType, foods, onAddMeal, onDeleteMeal, recommendTrigger }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 当 AI 推荐点击了"去添加"时，自动打开搜索
  useEffect(() => {
    if (recommendTrigger && recommendTrigger.mealType === mealType) {
      setSearchQuery(recommendTrigger.foodName);
      setShowSearch(true);
    }
  }, [recommendTrigger]);

  const handleAdd = ({ food, portion, customGrams }) => {
    onAddMeal(mealType, food, portion, customGrams);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
      {/* 卡片头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-main">{mealType}</h3>
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setShowSearch(true); }}
          className="flex items-center gap-1 text-xs text-primary font-medium px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Plus size={14} />
          添加
        </button>
      </div>

      {/* 食物列表 */}
      {foods && foods.length > 0 ? (
        <ul className="space-y-2">
          {foods.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-bg-main/50">
              <div className="flex-1 min-w-0">
                <span className="text-text-main truncate">{item.food_name}</span>
                <span className="text-text-sub ml-2 text-xs">({item.portion_size})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-medium text-xs whitespace-nowrap">
                  {Math.round(item.calories)} kcal
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteMeal(item.id)}
                  className="p-1 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} className="text-red-400 hover:text-red-500" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-sub py-3 text-center">暂无记录</p>
      )}

      {/* 搜索抽屉 */}
      {showSearch && (
        <FoodSearch
          onAdd={handleAdd}
          onClose={() => { setShowSearch(false); setSearchQuery(''); }}
          initialQuery={searchQuery}
        />
      )}
    </div>
  );
}
