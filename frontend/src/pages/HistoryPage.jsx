import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getMonthly, getMealDetails } from '../api/index';

const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr);
  return weekDayNames[d.getDay()];
}

export default function HistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState(null);
  const [detailData, setDetailData] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    setExpandedDate(null);
    setDetailData({});
    try {
      const res = await getMonthly(year, month);
      setMonthData(res.data);
    } catch (err) {
      console.error('加载月度数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadMonthData(); }, [loadMonthData]);

  // 切换展开/收起
  const handleToggleDate = async (date) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      return;
    }
    setExpandedDate(date);
    if (!detailData[date]) {
      setLoadingDetail(true);
      try {
        const res = await getMealDetails(date);
        setDetailData((prev) => ({
          ...prev,
          [date]: res.data,
        }));
      } catch {
        // 忽略
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  // 月份切换
  const goToPrevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
  };
  const goToNextMonth = () => {
    // 不超过当前月份
    if (year === now.getFullYear() && month >= now.getMonth() + 1) return;
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
  };

  const isCurrentOrFuture = year >= now.getFullYear() && month >= now.getMonth() + 1;

  const ORDER = ['早餐', '午餐', '晚餐', '点心', '零食', '饮料'];

  return (
    <div>
      {/* 页面标题 + 月份切换 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-main">历史记录</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={20} className="text-text-sub" />
          </button>
          <span className="text-sm font-semibold text-text-main min-w-[80px] text-center">
            {year}年{month}月
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            disabled={isCurrentOrFuture}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight size={20} className="text-text-sub" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-20 rounded-2xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* 月度摘要卡片 */}
          {monthData && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-50">
                <div className="text-xl font-bold text-primary">{monthData.stats.daysWithRecords}</div>
                <div className="text-xs text-text-sub">记录天数</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-50">
                <div className="text-xl font-bold text-secondary">{monthData.stats.avgCalories}</div>
                <div className="text-xs text-text-sub">平均热量(kcal)</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-50">
                <div className="text-xl font-bold text-red-400">{monthData.stats.maxCalories}</div>
                <div className="text-xs text-text-sub">最高热量(kcal)</div>
              </div>
            </div>
          )}

          {/* 历史记录列表 */}
          {monthData && monthData.days.length > 0 ? (
            <div className="space-y-2">
              {monthData.days.map((day) => {
                const isExpanded = expandedDate === day.date;
                const details = detailData[day.date];
                const d = new Date(day.date + 'T00:00:00');
                const dateLabel = `${d.getMonth() + 1}月${d.getDate()}日（周${getDayOfWeek(day.date)}）`;

                return (
                  <div key={day.date} className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                    {/* 收起状态 */}
                    <button
                      type="button"
                      onClick={() => handleToggleDate(day.date)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="font-medium text-sm text-text-main">{dateLabel}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary">
                          {Math.round(day.totalCalories)} kcal
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-text-sub" />
                        ) : (
                          <ChevronDown size={18} className="text-text-sub" />
                        )}
                      </div>
                    </button>

                    {/* 展开状态 */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-gray-50">
                        {loadingDetail && !details ? (
                          <div className="space-y-2 pt-3">
                            <div className="skeleton h-8 w-full" />
                            <div className="skeleton h-8 w-full" />
                          </div>
                        ) : details ? (
                          <div className="pt-3 space-y-2">
                            {ORDER.map((type) => {
                              const foods = details[type];
                              if (!foods || foods.length === 0) return null;
                              const subTotal = foods.reduce((s, f) => s + f.calories, 0);
                              return (
                                <div key={type} className="flex items-start gap-3 text-sm">
                                  <span className="text-text-sub shrink-0">{type}</span>
                                  <span className="flex-1 text-text-main">
                                    {foods.map((f) => `${f.food_name}(${f.portion_size})`).join(' · ')}
                                  </span>
                                  <span className="text-primary font-medium shrink-0">{Math.round(subTotal)} kcal</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-text-sub text-sm py-2 pt-3">暂无详情</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-sub">{month}月暂无饮食记录</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
