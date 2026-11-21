"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";
import { printUrl } from "@/lib/print";
import { roleLabel } from "@/lib/rbac";
import { DAYS } from "@/lib/routine-days";
import AttendanceCalendar from "@/components/AttendanceCalendar";

const LV = { pending: "অপেক্ষমাণ", approved: "অনুমোদিত", rejected: "প্রত্যাখ্যাত", cancelled: "বাতিল" };

// শিক্ষক/স্টাফ প্রোফাইল: সব তথ্য, বেতন, নিয়োগ, রুটিন, হাজিরা, ছুটি ও কার্যকলাপ
export default function Page({ params }) {
  const { id } = use(params); const { x, n, money, date } = useLang();
  const [cal, setCal] = useState(false); const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/staff/${id}/profile`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("লোড করা যায়নি")))); }, [id]); // eslint-disable-line
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const t = d.staff, a = d.attendance, P = (v) => (v === null ? "—" : n(v) + "%");
  const ct = d.assignments.filter((q) => q.kind === "class"), st = d.assignments.filter((q) => q.kind === "subject");
  const row = (l, v) => <div className="border-b border-dotted border-slate-300 py-1.5"><p className="text-xs text-slate-500">{l}</p><p className="font-semibold">{v || "—"}</p></div>;
  const tile = (l, v, c = "text-brand-dark") => <div className="rounded-xl border border-gold/40 bg-white p-3 text-center"><p className="text-xs text-slate-500">{l}</p><p className={`font-display text-2xl ${c}`}>{v}</p></div>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden"><Link href="/admin/staff" className="btn-ghost !py-2">{x("← তালিকা")}</Link><button className="btn-ghost !py-2 ml-auto" onClick={() => setCal(true)}>{x("হাজিরা ক্যালেন্ডার")}</button><button className="btn-primary !py-2" onClick={() => printUrl(`/admin/staff/${id}/print`)}>{x("প্রোফাইল প্রিন্ট")}</button></div>
      <div className="card flex flex-wrap items-center gap-5">
        {t.photo ? <img src={t.photo} alt="" className="h-28 w-28 rounded-2xl border-2 border-gold object-cover" /> : <span className="grid h-28 w-28 place-items-center rounded-2xl bg-brand-light font-display text-4xl text-brand">{t.name[0]}</span>}
        <div className="min-w-0 flex-1"><h1 className="font-display text-3xl text-brand-dark">{t.name}</h1><p className="text-slate-600">{x(roleLabel[t.role])}{t.designation ? ` · ${t.designation}` : ""}</p><p className="text-sm text-slate-500">{t.userId} · {t.active ? x("সক্রিয়") : x("নিষ্ক্রিয়")}</p>
          {ct.length > 0 && <p className="mt-1 text-sm font-semibold text-gold-deep">{x("ক্লাস টিচার")}: {ct.map((q) => `${x(q.class)}${q.section ? ` (${q.section})` : ""}`).join(", ")}</p>}</div>
        {t.salary !== undefined && <div className="rounded-xl bg-gold-light/60 px-5 py-3 text-center"><p className="text-xs text-slate-600">{x("মাসিক বেতন")}</p><p className="font-display text-3xl text-brand-dark">{money(t.salary || 0)}</p><p className="text-xs text-slate-500">{x("বার্ষিক")} {money((t.salary || 0) * 12)}</p></div>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h2 className="mb-2 font-bold">{x("ব্যক্তিগত ও পেশাগত তথ্য")}</h2><div className="grid grid-cols-2 gap-x-6">{row(x("মোবাইল"), t.phone)}{row(x("বিভাগ"), t.department)}{row(x("বিষয়"), t.subject)}{row(x("যোগদানের তারিখ"), t.joiningDate && date(t.joiningDate))}</div></div>
        <div className="card"><h2 className="mb-2 font-bold">{x("কার্যকলাপ (এ বছর)")}</h2><div className="grid grid-cols-2 gap-3">{tile(x("হাজিরা নিয়েছেন"), n(d.summary.attTaken))}{tile(x("নম্বর এন্ট্রি"), n(d.summary.marks))}</div></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h2 className="mb-2 font-bold">{x("নিয়োগ")}</h2>{d.assignments.length === 0 ? <p className="text-sm text-slate-500">{x("কোনো নিয়োগ নেই")}</p> : <ul className="space-y-1 text-sm">{ct.map((q, i) => <li key={"c" + i}><b className="text-gold-deep">{x("ক্লাস টিচার")}</b> — {x(q.class)}{q.section ? ` (${q.section})` : ""}</li>)}{st.map((q, i) => <li key={"s" + i}>{x("বিষয় শিক্ষক")} — {x(q.class)}{q.section ? ` (${q.section})` : ""}: <b>{q.subject ? x(q.subject) : "—"}</b></li>)}</ul>}</div>
        <div className="card"><h2 className="mb-2 font-bold">{x("হাজিরা")}</h2><div className="grid grid-cols-3 gap-3">{tile(x("এ মাস"), P(a.month.pct))}{tile(x("এ বছর"), P(a.year.pct))}{tile(x("অনুপস্থিত (বছর)"), n(a.year.absent), a.year.absent ? "text-red-600" : "text-brand-dark")}</div><p className="mt-2 text-xs text-slate-500">{x("উপস্থিত")} {n(a.year.present + a.year.late)} · {x("ছুটি")} {n(a.year.leave)}</p></div>
      </div>
      <div className="card"><h2 className="mb-2 font-bold">{x("সাপ্তাহিক রুটিন")} ({n(d.routine.length)} {x("টি ক্লাস")})</h2>{d.routine.length === 0 ? <p className="text-sm text-slate-500">{x("রুটিনে কোনো ক্লাস নেই")}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><tbody>{d.routine.map((r, i) => <tr key={i} className="border-b border-slate-100 last:border-0"><td className="py-1.5 pr-3 font-semibold">{x(DAYS[r.day])}</td><td className="pr-3">{r.startTime}–{r.endTime}</td><td className="pr-3">{x(r.class)}{r.section ? ` (${r.section})` : ""}</td><td>{x(r.subject)}</td></tr>)}</tbody></table></div>}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h2 className="mb-2 font-bold">{x("ছুটির আবেদন")}</h2>{d.leaves.length === 0 ? <p className="text-sm text-slate-500">{x("কোনো আবেদন নেই")}</p> : <ul className="space-y-1.5 text-sm">{d.leaves.map((l) => <li key={l._id} className="flex justify-between gap-2"><span>{date(l.from)} – {date(l.to)} <span className="text-slate-500">· {l.reason}</span></span><span className="font-semibold">{x(LV[l.status])}</span></li>)}</ul>}</div>
        <div className="card"><h2 className="mb-2 font-bold">{x("সাম্প্রতিক কাজ")}</h2>{d.activity.length === 0 ? <p className="text-sm text-slate-500">{x("কোনো কার্যকলাপ নেই")}</p> : <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">{d.activity.map((q, i) => <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-1"><span>{q.action} · {q.entity}{q.name ? ` — ${q.name}` : ""}</span><span className="shrink-0 text-xs text-slate-500">{date(String(q.at).slice(0, 10))}</span></li>)}</ul>}</div>
      </div>
      {cal && <AttendanceCalendar title={`${x("হাজিরা ক্যালেন্ডার")} — ${t.name}`} records={a.records} onClose={() => setCal(false)} />}
    </div>
  );
}
