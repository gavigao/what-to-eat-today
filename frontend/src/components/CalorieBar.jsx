const TARGET = 2000; // 推荐每日热量摄入

function getColor(percent) {
  if (percent < 60) return '#22C55E'; // 绿色
  if (percent <= 90) return '#F59E0B'; // 橙色
  return '#EF4444'; // 红色
}

export default function CalorieBar({ current = 0 }) {
  const percent = Math.min((current / TARGET) * 100, 100);
  const barColor = getColor(percent);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
      <h3 className="text-sm font-semibold text-text-main mb-3">今日热量</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold" style={{ color: barColor }}>
          {Math.round(current)}
        </span>
        <span className="text-sm text-text-sub">kcal</span>
        <span className="ml-auto text-sm text-text-sub">
          目标参考: {TARGET} kcal
        </span>
      </div>

      {/* 进度条 */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: barColor }}
        />
      </div>

      <p className="text-xs text-text-sub mt-2" style={{ color: barColor }}>
        已摄入 {percent.toFixed(0)}% · {percent >= 100 ? '超过推荐摄入量' : percent >= 90 ? '接近推荐上限' : percent >= 60 ? '摄入适中' : '摄入较少'}
      </p>
    </div>
  );
}
