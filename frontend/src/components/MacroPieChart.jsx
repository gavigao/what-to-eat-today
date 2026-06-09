import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  protein: '#4ECDC4',
  carbs: '#FF6B35',
  fat: '#FFD166',
};

const DEFAULT_RATIO = {
  protein: { min: 15, max: 20, label: '15-20%' },
  carbs: { min: 55, max: 65, label: '55-65%' },
  fat: { min: 20, max: 30, label: '20-30%' },
};

function formatRatioLabel(ratio) {
  if (!ratio) return null;
  return `${ratio.min}-${ratio.max}%`;
}

export default function MacroPieChart({ protein = 0, carbs = 0, fat = 0, macroRatio, isPersonalized }) {
  const ratio = macroRatio || DEFAULT_RATIO;

  // 三大营养素热量
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const totalCal = proteinCal + carbsCal + fatCal;

  const data = [
    { name: '蛋白质', value: proteinCal, grams: protein, color: COLORS.protein, label: `${protein.toFixed(1)}g` },
    { name: '碳水化合物', value: carbsCal, grams: carbs, color: COLORS.carbs, label: `${carbs.toFixed(1)}g` },
    { name: '脂肪', value: fatCal, grams: fat, color: COLORS.fat, label: `${fat.toFixed(1)}g` },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
        <h3 className="text-sm font-semibold text-text-main mb-3">三大营养素</h3>
        <p className="text-text-sub text-sm py-8 text-center">暂无数据</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = totalCal > 0 ? ((d.value / totalCal) * 100).toFixed(1) : 0;
      const key = d.name === '蛋白质' ? 'protein' : d.name === '碳水化合物' ? 'carbs' : 'fat';
      const rec = ratio[key];
      const inRange = rec && pct >= rec.min && pct <= rec.max;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-medium">{d.name}</p>
          <p>{d.grams?.toFixed(1)}g · 占比 {pct}%</p>
          {rec && (
            <p className={inRange ? 'text-green-500' : 'text-red-400'}>
              推荐 {rec.min}-{rec.max}% {inRange ? '✓' : '✗'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-text-main">三大营养素</h3>
        {isPersonalized && (
          <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-medium">
            个性化
          </span>
        )}
      </div>
      <div className="flex items-center">
        <div className="w-[55%] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 图例 + 推荐比例 */}
        <div className="w-[45%] space-y-2.5 text-xs">
          {data.map((d) => {
            const key = d.name === '蛋白质' ? 'protein' : d.name === '碳水化合物' ? 'carbs' : 'fat';
            const rec = ratio[key];
            const pct = totalCal > 0 ? ((d.value / totalCal) * 100).toFixed(1) : 0;
            const inRange = rec && pct >= rec.min && pct <= rec.max;
            return (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-text-main">{d.name}</span>
                <span className="text-text-sub ml-auto">{d.label}</span>
                {rec && (
                  <span className={`text-[10px] ${inRange ? 'text-green-500' : 'text-red-400'}`}>
                    {inRange ? '✓' : '偏离'}
                  </span>
                )}
              </div>
            );
          })}
          <div className="border-t border-gray-100 pt-2 mt-2 text-text-sub">
            <p className="mb-0.5">{isPersonalized ? '你的推荐比例:' : '通用推荐比例:'}</p>
            <p>蛋白质 {formatRatioLabel(ratio.protein)}</p>
            <p>碳水 {formatRatioLabel(ratio.carbs)}</p>
            <p>脂肪 {formatRatioLabel(ratio.fat)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
