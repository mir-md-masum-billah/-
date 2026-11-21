"use client";
import { useEffect, useState, useCallback } from "react";
import { api, Pager } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import { CATEGORIES, ACTION_FILTERS, describe } from "@/lib/auditText";

const tone = { add: "border-l-brand bg-brand-light/40", change: "border-l-amber-500 bg-amber-50/60", delete: "border-l-red-500 bg-red-50/60" };
const dot = { add: "bg-brand", change: "bg-amber-500", delete: "bg-red-500" };

// অডিট লগ: কে, কী করেছেন, কী বদলেছে (পুরোনো → নতুন), কখন — ক্যাটাগরি/কাজ/ব্যবহারকারী/তারিখ দিয়ে ছেঁকে দেখা যায়
export default function Audit() {
  const { lang, x } = useLang();
  const [d, setD] = useState({ items: [], total: 0, pages: 1, users: [] }); const [page, setPage] = useState(1); const [err, setErr] = useState(""); const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ q: "", cat: "", action: "", user: "", from: "", to: "" }); const [dq, setDq] = useState("");
  useEffect(() => { const t = setTimeout(() => { setDq(f.q); setPage(1); }, 350); return () => clearTimeout(t); }, [f.q]);
  useEffect(() => { setPage(1); }, [f.cat, f.action, f.user, f.from, f.to]);
  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 30 });
    if (dq) p.set("q", dq); if (f.cat) p.set("entity", CATEGORIES[f.cat].entities.join(",")); if (f.action) p.set("action", f.action === "delete" ? "delete,archive,deactivate" : f.action); if (f.user) p.set("user", f.user); if (f.from) p.set("from", f.from); if (f.to) p.set("to", f.to);
    const r = await api("GET", `/api/audit?${p}`); r.ok ? (setD((o) => ({ ...r.d, users: r.d.users?.length ? r.d.users : o.users })), setErr("")) : setErr(r.d.error || x("লোড করা যায়নি")); setLoading(false);
  }, [page, dq, f.cat, f.action, f.user, f.from, f.to]);
  useEffect(() => { load(); }, [load]);
  const when = (s) => new Date(s).toLocaleString(lang === "en" ? "en-GB" : "bn-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" });
  const clear = () => setF({ q: "", cat: "", action: "", user: "", from: "", to: "" });
  const any = Object.values(f).some(Boolean);
  return (
    <div>
      <h1 className="mb-1 text-3xl text-brand-dark">{x("অডিট লগ")}</h1>
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input className="input lg:col-span-2" placeholder={x("খুঁজুন (নাম, রসিদ, ইনভয়েস...)")} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select className="input" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} aria-label={x("ক্যাটাগরি")}><option value="">{x("সব ক্যাটাগরি")}</option>{Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{lang === "en" ? c.en : c.bn}</option>)}</select>
        <select className="input" value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} aria-label={x("কার্যক্রম")}><option value="">{x("সব কার্যক্রম")}</option>{ACTION_FILTERS.map(([k, b, e]) => <option key={k} value={k}>{lang === "en" ? e : b}</option>)}</select>
        <select className="input" value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} aria-label={x("ব্যবহারকারী")}><option value="">{x("সব ব্যবহারকারী")}</option>{d.users.map((u) => <option key={u} value={u}>{u}</option>)}</select>
        <div className="flex gap-2"><input type="date" className="input" value={f.from} max={f.to || undefined} onChange={(e) => setF({ ...f, from: e.target.value })} aria-label={x("শুরুর তারিখ")} /><input type="date" className="input" value={f.to} min={f.from || undefined} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label={x("শেষের তারিখ")} /></div>
        {any && <button className="btn-ghost !py-1.5 sm:col-span-2 lg:col-span-6" onClick={clear}>{x("ফিল্টার মুছুন")}</button>}
      </div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <ul className={`space-y-2 ${loading ? "opacity-60" : ""}`}>{d.items.map((a) => { const e = describe(a, lang); return (
        <li key={a._id} className={`rounded-lg border border-l-4 border-slate-200 p-3 ${tone[e.kind]}`}>
          <div className="flex flex-wrap items-start justify-between gap-2"><p className="flex min-w-0 items-start gap-2 font-semibold text-ink"><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dot[e.kind]}`} />{e.sentence}</p><span className="whitespace-nowrap text-xs text-slate-500">{when(a.createdAt)}</span></div>
          <p className="mt-0.5 pl-4 text-xs text-slate-500">{lang === "en" ? CATEGORIES[e.category]?.en : CATEGORIES[e.category]?.bn}{a.role ? ` · ${a.role}` : ""}</p>
          {e.facts.length > 0 && <p className="mt-1 pl-4 text-sm text-slate-700">{e.facts.join(" · ")}</p>}
          {e.changes.length > 0 && <ul className="mt-2 space-y-1 pl-4 text-sm">{e.changes.map((c, i) => <li key={i} className="flex flex-wrap items-center gap-1.5"><span className="font-semibold text-slate-700">{c.field}:</span><span className="rounded bg-red-100 px-1.5 text-red-800 line-through decoration-red-400/70">{c.from}</span><span aria-hidden="true">→</span><span className="rounded bg-brand-light px-1.5 font-semibold text-brand">{c.to}</span></li>)}</ul>}
        </li>); })}
        {!loading && d.items.length === 0 && <li className="card py-10 text-center text-slate-500">{x("কোনো রেকর্ড পাওয়া যায়নি")}</li>}</ul>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />
    </div>
  );
}
