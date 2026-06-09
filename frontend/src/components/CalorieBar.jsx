import { useState, useEffect, useRef } from 'react';

const DEFAULT_TARGET = 2000;

function getColor(percent) {
  if (percent < 60) return '#22C55E';
  if (percent <= 90) return '#FF6B35';
  return '#EF4444';
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const startTime = useRef(null);
  const startVal = useRef(0);

  useEffect(() => {
    startVal.current = value;
    startTime.current = null;
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOut
      setValue(Math.round(startVal.current + (target - startVal.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return value;
}

export default function CalorieBar({ current = 0, target, isPersonalized }) {
  const targetCal = target || DEFAULT_TARGET;
  const percent = Math.min(current / targetCal * 100, 100);
  const barColor = getColor(percent);
  const animatedCal = useCountUp(Math.round(current));
  const remaining = Math.max(0, Math.round(targetCal - current));

  // SVG 圆环参数
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 54;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const statusText = percent >= 100 ? '已超量' : percent >= 90 ? '接近上限' : percent >= 60 ? '摄入适中 ✓' : '摄入较少';

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-main">今日热量</h3>
        {isPersonalized && (
          <span className="text-[10px] bg-[#FFF8F5] text-[#FF6B35] px-2 py-0.5 rounded-full font-medium">
            个性化
          </span>
        )}
      </div>

      {/* 渐变背景 */}
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #FFF7F4 0%, #FFFFFF 60%)' }}>
        <div className="flex items-center justify-center gap-6">
          {/* SVG 圆环 */}
          <svg width={size} height={size} className="shrink-0">
            {/* 轨道 */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
            {/* 进度弧 */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke={barColor} strokeWidth={strokeWidth}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
            />
            {/* 中心文字 */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="24" fontWeight="700" fill={barColor} fontFamily="inherit">
              {animatedCal}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="inherit">
              {remaining > 0 ? `还差 ${remaining}` : '已达标'} kcal
            </text>
          </svg>

          {/* 右侧信息 */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-text-sub text-xs">已摄入</span>
              <p className="text-lg stat-number" style={{ color: barColor }}>{percent.toFixed(0)}%</p>
            </div>
            <div>
              <span className="text-text-sub text-xs">目标</span>
              <p className="text-base stat-number text-text-main">{targetCal} kcal</p>
            </div>
            <span className="text-xs font-medium" style={{ color: barColor }}>{statusText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
