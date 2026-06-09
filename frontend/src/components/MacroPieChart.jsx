import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  protein: '#4ECDC4',
  carbs: '#FF6B35',
  fat: '#FFD166',
};

const RECOMMENDED = {
  protein: { min: 15, max: 20, label: '15-20%' },
  carbs: { min: 55, max: 65, label: '55-65%' },
  fat: { min: 20, max: 30, label: '20-30%' },
};

export default function MacroPieChart({ protein = 0, carbs = 0, fat = 0 }) {
  // 三大营养素热量：蛋白质 4kcal/g，碳水 4kcal/g，脂肪 9kcal/g
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
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-medium">{d.name}</p>
          <p>{d.grams?.toFixed(1)}g</p>
          <p>占总热量 {pct}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
      <h3 className="text-sm font-semibold text-text-main mb-3">三大营养素</h3>
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
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-text-main">{d.name}</span>
              <span className="text-text-sub ml-auto">{d.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 text-text-sub">
            <p className="mb-0.5">推荐比例参考:</p>
            <p>蛋白质 {RECOMMENDED.protein.label}</p>
            <p>碳水 {RECOMMENDED.carbs.label}</p>
            <p>脂肪 {RECOMMENDED.fat.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
