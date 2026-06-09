import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getAnalysis, analyzeDiet } from '../api/index';

export default function AiAdvicePanel({ date }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 页面加载时尝试获取已有分析
  useEffect(() => {
    (async () => {
      try {
        const res = await getAnalysis(date);
        if (res.data) {
          setAnalysis(res.data);
        }
      } catch {
        // 忽略
      } finally {
        setFetching(false);
      }
    })();
  }, [date]);

  // 触发分析
  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeDiet(date);
      setAnalysis(res.data);
    } catch (err) {
      alert('分析失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
        <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-secondary" /> AI 饮食建议
        </h3>
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
          <Sparkles size={16} className="text-secondary" /> AI 饮食建议
        </h3>
        {analysis && (
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-secondary px-2.5 py-1 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            重新分析
          </button>
        )}
      </div>

      {!analysis && !loading && (
        <div className="text-center py-6">
          <p className="text-text-sub text-sm mb-3">获取 AI 对今日饮食的专业分析</p>
          <button
            type="button"
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-colors"
          >
            <Sparkles size={16} />
            点击分析今日饮食
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-3">
          {/* 总体评价 */}
          <div className="bg-bg-main rounded-xl p-3">
            <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">
              {analysis.analysis}
            </p>
          </div>

          {/* 建议列表 */}
          {analysis.suggestions && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-sub">改善建议</p>
              <div className="space-y-2">
                {analysis.suggestions
                  .split('\n')
                  .filter((s) => s.trim())
                  .map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-text-main">{s.replace(/^\d+[\.\、\s]+/, '')}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {analysis.cached && (
            <p className="text-xs text-text-sub text-right">
              {analysis.cached ? '📋 缓存结果' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
