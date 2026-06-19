const TIME_SLOTS = {
  '早餐': { time: '08:00', icon: '🌅' },
  '午餐': { time: '12:00', icon: '☀️' },
  '晚餐': { time: '18:00', icon: '🌙' },
  '零食': { time: '15:00', icon: '🍪' },
  '饮料': { time: '14:00', icon: '🥤' },
};

export default function MealTimeline({ meals = {} }) {
  const types = Object.keys(meals);
  const hasData = types.some(t => meals[t] && meals[t].length > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <h3 className="text-sm font-semibold text-text-main mb-3">三餐时间轴</h3>
        <p className="text-text-sub text-sm py-6 text-center">暂无记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <h3 className="text-sm font-semibold text-text-main mb-4">三餐时间轴</h3>

      <div className="relative">
        {/* 竖线 */}
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {Object.entries(TIME_SLOTS).map(([type, { time, icon }]) => {
            const foods = meals[type];
            if (!foods || foods.length === 0) return null;
            const subTotal = foods.reduce((sum, f) => sum + f.calories, 0);

            return (
              <div key={type} className="relative flex gap-4 pl-2">
                {/* 节点 */}
                <div className="relative z-10 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-sm shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-text-main">{type}</span>
                    <span className="text-xs text-text-sub">{time}</span>
                    <span className="ml-auto text-sm font-semibold text-primary">
                      {Math.round(subTotal)} kcal
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {foods.map((f, i) => (
                      <li key={f.id || i} className="text-xs text-text-sub">
                        {f.food_name} · {f.portion_size} · {Math.round(f.calories)} kcal
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
