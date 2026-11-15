"use client";
import Icon from "@/components/ui/Icon";

export function PageHeader({ title, subtitle, icon, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="mr-auto flex min-w-0 items-center gap-3">
        {icon && <span className="arch bg-brand-light text-brand"><Icon name={icon} size={22} /></span>}
        <div className="min-w-0"><h1 className="truncate font-display text-[1.7rem] font-normal leading-tight sm:text-3xl">{title}</h1>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</div>
      </div>
      {children}
    </div>
  );
}
const TONES = { brand: "bg-brand-light text-brand", gold: "bg-gold-light text-amber-800", red: "bg-red-100 text-red-700", slate: "bg-slate-100 text-slate-600" };
export function StatCard({ label, value, icon = "trend", tone = "brand", valueClass = "" }) {
  return (
    <div className="card flex items-center gap-3 !p-3 sm:gap-4 sm:!p-5">
      <span className={`arch arch-sm sm:arch-lg ${TONES[tone] || TONES.brand}`}><Icon name={icon} size={20} /></span>
      <div className="min-w-0"><p className="break-words text-xs leading-snug text-slate-600 sm:text-sm">{label}</p><p className={`truncate font-display text-2xl leading-tight sm:text-3xl ${valueClass}`}>{value}</p></div>
    </div>
  );
}
export function EmptyState({ title, hint, icon = "inbox" }) {
  return <div className="grid place-items-center gap-2 px-4 py-12 text-center"><span className="arch arch-lg bg-slate-100 text-slate-400"><Icon name={icon} size={26} /></span><p className="font-semibold text-slate-700">{title}</p>{hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}</div>;
}
export function Skeleton({ className = "h-4 w-full" }) { return <div className={`skeleton ${className}`} />; }
export function SkeletonRows({ rows = 5 }) { return <div className="space-y-3 p-4">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>; }
export function Alert({ children, tone = "red" }) {
  const c = tone === "red" ? "bg-red-50 text-red-700 border-red-300/50" : "bg-amber-50 text-amber-800 border-amber-100";
  return <div role="alert" className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${c}`}><Icon name="alert" size={18} className="mt-0.5" /><div>{children}</div></div>;
}
