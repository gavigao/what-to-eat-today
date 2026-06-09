import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import CalorieBar from '../components/CalorieBar';
import MacroPieChart from '../components/MacroPieChart';
import MealTimeline from '../components/MealTimeline';
import TrendChart from '../components/TrendChart';
import AiAdvicePanel from '../components/AiAdvicePanel';
import { getMeals, getSummary, getProfile } from '../api/index';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardPage() {
  const [date] = useState(getTodayStr());
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState({});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [mealsRes, summaryRes, profileRes] = await Promise.all([
          getMeals(date),
          getSummary(date),
          getProfile(),
        ]);
        setMeals(mealsRes.data || {});
        setSummary(summaryRes.data);
        if (profileRes.data) {
          setProfile(profileRes.data);
        }
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-main">饮食仪表盘</h2>
        {!profile && (
          <Link
            to="/profile"
            className="flex items-center gap-1.5 text-xs text-primary font-medium px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <UserCircle size={14} />
            设置个人画像
          </Link>
        )}
      </div>

      {/* 热量进度条（动态目标） */}
      <CalorieBar
        current={summary?.totalCalories || 0}
        target={profile?.targetCalories}
        isPersonalized={!!profile}
      />

      {/* 营养素饼图（个性化比例） */}
      <MacroPieChart
        protein={summary?.protein || 0}
        carbs={summary?.carbs || 0}
        fat={summary?.fat || 0}
        macroRatio={profile?.macroRatio}
        isPersonalized={!!profile}
      />

      {/* 三餐时间轴 */}
      <MealTimeline meals={meals} />

      {/* 近7天趋势图 */}
      <TrendChart target={profile?.targetCalories} />

      {/* AI 饮食建议 */}
      <AiAdvicePanel date={date} />
    </div>
  );
}
