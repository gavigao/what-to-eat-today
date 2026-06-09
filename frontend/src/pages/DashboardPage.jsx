import { useState, useEffect } from 'react';
import CalorieBar from '../components/CalorieBar';
import MacroPieChart from '../components/MacroPieChart';
import MealTimeline from '../components/MealTimeline';
import TrendChart from '../components/TrendChart';
import AiAdvicePanel from '../components/AiAdvicePanel';
import { getMeals, getSummary } from '../api/index';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardPage() {
  const [date] = useState(getTodayStr());
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [mealsRes, summaryRes] = await Promise.all([
          getMeals(date),
          getSummary(date),
        ]);
        setMeals(mealsRes.data || {});
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('加载仪表盘失败:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [date]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-main">饮食仪表盘</h2>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-text-main">饮食仪表盘</h2>

      {/* 热量进度条 */}
      <CalorieBar current={summary?.totalCalories || 0} />

      {/* 营养素饼图 */}
      <MacroPieChart
        protein={summary?.protein || 0}
        carbs={summary?.carbs || 0}
        fat={summary?.fat || 0}
      />

      {/* 三餐时间轴 */}
      <MealTimeline meals={meals} />

      {/* 近7天趋势图 */}
      <TrendChart />

      {/* AI 饮食建议 */}
      <AiAdvicePanel date={date} />
    </div>
  );
}
