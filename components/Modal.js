"use client";
import Icon from "./Icon";
import { useLang } from "./LangProvider";
export default function Modal({ title, onClose, children, wide }) {
  const { x } = useLang();
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-night/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t-2 border-gold bg-white p-6 shadow-gilt sm:rounded-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-display text-2xl text-brand-dark">{title}</h2><button onClick={onClose} aria-label={x("বন্ধ করুন")} className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-ink"><Icon name="close" className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}
