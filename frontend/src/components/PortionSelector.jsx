const PORTIONS = [
  { value: '少量', label: '少量', desc: '约¼份', coef: 0.25 },
  { value: '半份', label: '半份', desc: '半份', coef: 0.5 },
  { value: '一份', label: '一份', desc: '标准份', coef: 1.0 },
  { value: '自定义', label: '自定义', desc: '输入克数', coef: null },
];

export default function PortionSelector({ value, onChange, customGrams, onCustomGramsChange, servingDesc }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-main">
        选择份量
        {servingDesc && <span className="text-text-sub font-normal ml-1">（{servingDesc}）</span>}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {PORTIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`py-2 px-1 rounded-xl border-2 text-center transition-all text-sm ${
              value === p.value
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-gray-200 text-text-sub hover:border-gray-300'
            }`}
          >
            <div>{p.label}</div>
            <div className="text-xs opacity-70">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* 自定义克数输入 */}
      {value === '自定义' && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-text-sub shrink-0">实际吃了</span>
          <input
            type="number"
            value={customGrams || ''}
            onChange={(e) => onCustomGramsChange && onCustomGramsChange(e.target.value)}
            placeholder="例如 350"
            min="1"
            step="1"
            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm text-text-sub shrink-0">g / ml</span>
        </div>
      )}
    </div>
  );
}
