const PORTIONS = [
  { value: '少量', label: '少量', desc: '约¼份', coef: 0.25 },
  { value: '半份', label: '半份', desc: '半份', coef: 0.5 },
  { value: '一份', label: '一份', desc: '标准份', coef: 1.0 },
  { value: '多份', label: '多份', desc: '约1.5份', coef: 1.5 },
];

export default function PortionSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-main">选择份量</p>
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
    </div>
  );
}
