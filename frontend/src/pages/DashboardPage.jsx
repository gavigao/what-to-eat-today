import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import CalorieBar from '../components/CalorieBar';
import MacroPieChart from '../components/MacroPieChart';
import MealTimeline from '../components/MealTimeline';
import TrendChart from '../components/TrendChart';
import AiAdvicePanel from '../components/AiAdvicePanel';
import { getMeals, getSummary, getProfile } from '../api/index';

const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr) {
  const today = getTodayStr();
  const d = new Date(dateStr + 'T00:00:00');
  const label = `${d.getMonth() + 1}月${d.getDate()}日 周${weekDayNames[d.getDay()]}`;
  if (dateStr === today) return label + '（今天）';
  return label;
}

export default function DashboardPage() {
  const [date, setDate] = useState(getTodayStr());
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState({});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
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

  const todayStr = getTodayStr();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-main">饮食仪表盘</h2>
        </div>
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

      {/* 日期选择器 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDate(shiftDate(date, -1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} className="text-text-sub" />
        </button>

        <div className="relative flex-1 flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-text-main">{formatDateLabel(date)}</span>
          <div className="relative">
            <Calendar size={15} className="text-text-sub cursor-pointer" />
            <input
              type="date"
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = shiftDate(date, 1);
            if (next <= todayStr) setDate(next);
          }}
          disabled={date >= todayStr}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} className="text-text-sub" />
        </button>
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
