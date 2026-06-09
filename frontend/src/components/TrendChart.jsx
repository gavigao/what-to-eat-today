import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getTrend } from '../api/index';

const DEFAULT_TARGET = 2000;

export default function TrendChart({ target }) {
  const TARGET = target || DEFAULT_TARGET;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTrend(7);
        const rows = (res.data || []).map((r) => ({
          date: r.date?.slice(5) || r.date, // MM-DD 格式
          totalCalories: Math.round(r.totalCalories),
        }));
        setData(rows);
      } catch (err) {
        console.error('加载趋势失败:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <h3 className="text-sm font-semibold text-text-main mb-3">近7天热量趋势</h3>
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <h3 className="text-sm font-semibold text-text-main mb-3">近7天热量趋势</h3>
      {data.length === 0 ? (
        <p className="text-text-sub text-sm py-6 text-center">暂无数据</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              formatter={(value) => [`${value} kcal`, '热量']}
              labelFormatter={(label) => `${label}`}
            />
            <ReferenceLine y={TARGET} stroke="#EF4444" strokeDasharray="5 5" label={{ value: `${TARGET}`, position: 'right', fontSize: 11, fill: '#EF4444' }} />
            <Bar dataKey="totalCalories" fill="#FF6B35" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
