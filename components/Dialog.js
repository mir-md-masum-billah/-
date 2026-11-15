"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useLang } from "./LangProvider";

// সুন্দর নিশ্চিতকরণ / কারণ-জিজ্ঞাসার বক্স — ব্রাউজারের কুৎসিত confirm()/prompt() এর বদলে।
//   if (!(await confirmBox("মুছবেন?", { danger: true }))) return;
//   const reason = await promptBox("বাতিলের কারণ:", { danger: true });   // বাতিল করলে null
// <DialogHost /> একবার layout.js-এ বসানো আছে।
const EVT = "app:dialog";
const open = (detail) => new Promise((resolve) => window.dispatchEvent(new CustomEvent(EVT, { detail: { ...detail, resolve } })));
export const confirmBox = (message, opts = {}) => open({ kind: "confirm", message, ...opts });
export const promptBox = (message, opts = {}) => open({ kind: "prompt", message, ...opts });

const L = {
  bn: { ok: "নিশ্চিত করুন", cancel: "বাতিল", confirmTitle: "নিশ্চিত করুন", promptTitle: "কারণ লিখুন", ph: "এখানে লিখুন…" },
  en: { ok: "Confirm", cancel: "Cancel", confirmTitle: "Please confirm", promptTitle: "Enter a reason", ph: "Type here…" },
};

export default function DialogHost() {
  const { lang } = useLang(); const l = L[lang] || L.bn;
  const [d, setD] = useState(null); const [val, setVal] = useState("");
  const dRef = useRef(null); dRef.current = d;
  const okRef = useRef(null); const inRef = useRef(null);

  useEffect(() => {
    const on = (e) => { dRef.current?.resolve(dRef.current.kind === "prompt" ? null : false); setVal(""); setD(e.detail); };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);

  useEffect(() => { if (d) (inRef.current || okRef.current)?.focus(); }, [d]);

  const done = (result) => { const cur = dRef.current; setD(null); setVal(""); cur?.resolve(result); };
  const cancel = () => done(dRef.current?.kind === "prompt" ? null : false);
  const submit = () => {
    if (!d) return;
    if (d.kind === "prompt") { const v = val.trim(); if (!v) { inRef.current?.focus(); return; } done(v); } else done(true);
  };

  useEffect(() => {
    if (!d) return;
    const key = (e) => {
      if (e.key === "Escape") { e.preventDefault(); cancel(); }
      if (e.key === "Enter" && !(e.target.tagName === "TEXTAREA" && e.shiftKey)) { e.preventDefault(); submit(); }
      if (e.key === "Tab") { // ফোকাস বক্সের ভেতরেই থাকে
        const els = [...document.querySelectorAll("#dlg-card button, #dlg-card textarea")].filter((n) => !n.disabled);
        if (!els.length) return;
        const i = els.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? els.length - 1 : i - 1) : (i === els.length - 1 ? 0 : i + 1);
        e.preventDefault(); els[n].focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }); // প্রতি রেন্ডারে নতুন val ধরার জন্য

  if (!d) return null;
  const danger = !!d.danger, isPrompt = d.kind === "prompt";
  return (
    <div className="dlg-back fixed inset-0 z-[120] grid place-items-center bg-night/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) cancel(); }}>
      <div id="dlg-card" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg"
        className="dlg-card w-full max-w-sm rounded-2xl border-t-2 border-gold bg-white p-6 text-center shadow-gilt">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${danger ? "bg-red-50 text-red-600 ring-8 ring-red-50/60" : "bg-gold-light text-gold-deep ring-8 ring-gold-light/60"}`}>
          <Icon name="warn" className="h-7 w-7" />
        </span>
        <h2 id="dlg-title" className="mt-4 font-display text-2xl text-brand-dark">{d.title || (isPrompt ? l.promptTitle : l.confirmTitle)}</h2>
        <p id="dlg-msg" className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{d.message}</p>
        {isPrompt && <textarea ref={inRef} rows={3} value={val} onChange={(e) => setVal(e.target.value)} placeholder={d.placeholder || l.ph} className="input mt-4 resize-none text-left" />}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="btn-ghost" onClick={cancel}>{d.cancelText || l.cancel}</button>
          <button type="button" ref={okRef} className={danger ? "btn-danger" : "btn-primary"} disabled={isPrompt && !val.trim()} onClick={submit}>{d.confirmText || l.ok}</button>
        </div>
      </div>
    </div>
  );
}
