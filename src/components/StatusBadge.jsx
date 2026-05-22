const toneClasses = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

export default function StatusBadge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClasses[tone] || toneClasses.neutral}`}
    >
      {children}
    </span>
  );
}
