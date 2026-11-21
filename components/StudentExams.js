"use client";
import { useEffect, useState } from "react";
import { api } from "./CrudPage";
import Icon from "./Icon";
import Loader from "./Loader";
import { useLang } from "./LangProvider";
import { fmtTime } from "./AdmitCardView";

export default function StudentExams({ onPay, refreshKey }) {
  const { x, money, date } = useLang();
  const [items, setItems] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", "/api/student/exams").then((r) => (r.ok ? setItems(r.d.items) : setErr(r.d.error || x("লোড করা যায়নি")))); }, [refreshKey]);
  if (err) return <p className="card text-red-700">{err}</p>;
  if (!items) return <Loader compact label={x("লোড হচ্ছে...")} />;
  if (!items.length) return <p className="card text-slate-500">{x("এখন কোনো পরীক্ষার নোটিশ নেই")}</p>;
  return items.map((e) => { const rows = [...e.schedule].sort((a, b) => a.date.localeCompare(b.date)); const paid = e.fee > 0 && e.invoice && e.invoice.due <= 0;
    return (
      <article key={e._id} className="card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-bold text-brand-dark">{e.name}</h2><p className="text-xs text-slate-500">{x(e.class)}{e.section ? ` (${e.section})` : ""}</p></div><a target="_blank" href={`/exam-notice/${e._id}`} className="btn-ghost !py-1.5 text-sm"><Icon name="file" className="h-4 w-4" /> {x("রুটিন PDF")}</a></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><tbody>{rows.map((r, i) => <tr key={i}><td className="td whitespace-nowrap">{date(r.date)}</td><td className="td font-semibold">{x(r.subject)}</td><td className="td whitespace-nowrap">{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</td></tr>)}</tbody></table></div>
        {e.instructions && <p className="whitespace-pre-line text-sm text-slate-700">{e.instructions}</p>}
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-brand-light/50 p-3 text-sm">
          {e.fee > 0 && <span>{x("পরীক্ষার ফি")}: <b>{money(e.fee)}</b> — {paid ? <b className="text-brand">{x("পরিশোধিত ✓")}</b> : e.pending ? <b className="text-amber-700">{x("যাচাই চলছে")}</b> : <b className="text-red-600">{x("বকেয়া")}</b>}</span>}
          {e.fee > 0 && !paid && !e.pending && e.invoice && <button className="btn-primary !py-1.5 text-sm" onClick={() => onPay(e.invoice._id)}>{x("ফি পরিশোধ করুন")}</button>}
          <span className="ml-auto">{e.admit?.eligible ? <a target="_blank" href={`/student/admit/${e.admit.id}`} className="btn-gold !py-1.5 text-sm"><Icon name="print" className="h-4 w-4" /> {x("প্রবেশপত্র (PDF/প্রিন্ট)")}</a> : null}</span>
        </div>
      </article>); });
}
