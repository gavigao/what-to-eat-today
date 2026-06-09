import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FoodSearch from './FoodSearch';

export default function MealCard({ mealType, foods, onAddMeal, onDeleteMeal, recommendTrigger, mealColor, mealIcon }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const borderColor = mealColor || '#FF6B35';

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

  const hasFoods = foods && foods.length > 0;

  return (
    <div
      className="bg-white rounded-2xl p-4 card-shadow overflow-hidden"
      style={{ borderTop: `3px solid ${borderColor}` }}
    >
      {/* 卡片头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: borderColor }} />
          {mealIcon && <span className="text-sm">{mealIcon}</span>}
          <h3 className="font-semibold text-text-main">{mealType}</h3>
        </div>
        <button
          type="button"
          onClick={() => { setSearchQuery(''); setShowSearch(true); }}
          className="flex items-center gap-1 text-xs text-white font-medium px-2.5 py-1 rounded-lg bg-[#FF6B35] hover:bg-[#FF5A20] transition-colors"
        >
          <Plus size={14} />
          添加
        </button>
      </div>

      {/* 食物列表 */}
      {hasFoods ? (
        <ul className="space-y-2">
          {foods.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-bg-main/50">
              <div className="flex-1 min-w-0">
                <span className="text-text-main truncate">{item.food_name}</span>
                <span className="text-text-sub ml-2 text-xs">({item.portion_size})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-medium text-xs whitespace-nowrap stat-number">
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
        <div className="text-center py-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2" className="mx-auto mb-2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="2" x2="12" y2="7" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="2" y1="12" x2="7" y2="12" />
            <line x1="17" y1="12" x2="22" y2="12" />
          </svg>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>还没有记录，点击添加</p>
        </div>
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
