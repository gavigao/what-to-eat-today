import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getWeightLog } from '../api/index';

// 计算趋势：首尾比较，至少 3 个数据点
function calcTrend(data) {
  if (data.length < 3) return null;
  const first = data[0].weight;
  const last = data[data.length - 1].weight;
  const diff = last - first;
  if (Math.abs(diff) < 0.3) return { dir: 'flat', diff: 0 };
  return { dir: diff > 0 ? 'up' : 'down', diff: Math.abs(diff).toFixed(1) };
}

export default function WeightTrendChart() {
  const [data, setData] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getWeightLog(30);
        const rows = (res.data || []).map((r) => ({
          date: r.date?.slice(5) || r.date,
          weight: parseFloat(r.weight),
        }));
        setData(rows);
        setTrend(calcTrend(rows));
      } catch (err) {
        console.error('加载体重数据失败:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <h3 className="text-sm font-semibold text-text-main mb-3">体重趋势</h3>
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <h3 className="text-sm font-semibold text-text-main mb-3">体重趋势</h3>
        <p className="text-text-sub text-sm py-6 text-center">
          暂无体重数据，保存个人画像后自动记录
        </p>
      </div>
    );
  }

  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus;
  const trendColor = trend?.dir === 'up' ? 'text-red-500' : trend?.dir === 'down' ? 'text-green-500' : 'text-gray-400';
  const trendLabel = trend?.dir === 'up' ? `+${trend.diff} kg` : trend?.dir === 'down' ? `-${trend.diff} kg` : '持平';
  const avgWeight = (data.reduce((s, d) => s + d.weight, 0) / data.length).toFixed(1);
  const yMin = Math.floor(Math.min(...data.map(d => d.weight)) - 1);
  const yMax = Math.ceil(Math.max(...data.map(d => d.weight)) + 1);

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-main">体重趋势</h3>
        <div className="flex items-center gap-0.5 text-xs font-medium">
          <span className="text-text-sub mr-1">均值 {avgWeight} kg</span>
          {trend && (
            <span className={`flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon size={14} />
              {trendLabel}
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
            formatter={(value) => [`${value} kg`, '体重']}
            labelFormatter={(label) => `${label}`}
          />
          {data.length > 0 && (
            <ReferenceLine
              y={data[0].weight}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: `${data[0].weight}`, position: 'right', fontSize: 11, fill: '#9ca3af' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#4ECDC4"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#4ECDC4', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#4ECDC4', strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
