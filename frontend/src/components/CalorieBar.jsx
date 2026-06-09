const DEFAULT_TARGET = 2000;

function getColor(percent) {
  if (percent < 60) return '#22C55E';
  if (percent <= 90) return '#F59E0B';
  return '#EF4444';
}

export default function CalorieBar({ current = 0, target, isPersonalized }) {
  const targetCal = target || DEFAULT_TARGET;
  const percent = Math.min((current / targetCal) * 100, 100);
  const barColor = getColor(percent);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-text-main">今日热量</h3>
        {isPersonalized && (
          <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-medium">
            个性化
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold" style={{ color: barColor }}>
          {Math.round(current)}
        </span>
        <span className="text-sm text-text-sub">/ {targetCal} kcal</span>
      </div>

      {/* 进度条 */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex justify-between items-center mt-2">
        <p className="text-xs" style={{ color: barColor }}>
          已摄入 {percent.toFixed(0)}% · {percent >= 100 ? '超过推荐量' : percent >= 90 ? '接近上限' : percent >= 60 ? '摄入适中' : '摄入较少'}
        </p>
        {!isPersonalized && (
          <p className="text-[10px] text-text-sub">
            默认参考 2000 kcal，设置<a href="/profile" className="text-primary underline">个人画像</a>更精准
          </p>
        )}
      </div>
    </div>
  );
}
