"use client";
export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} aria-label="বন্ধ করুন" className="text-2xl leading-none text-slate-500">×</button></div>
        {children}
      </div>
    </div>
  );
}
