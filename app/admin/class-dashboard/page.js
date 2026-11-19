"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useSettings from "@/hooks/useSettings";
import { api } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import StudentListPrint from "@/components/StudentListPrint";

const TODAY = { present: ["উপস্থিত", "bg-brand-light text-brand"], late: ["দেরি", "bg-gold-light text-ink"], absent: ["অনুপস্থিত", "bg-red-100 text-red-700"], leave: ["ছুটি", "bg-amber-100 text-amber-800"], holiday: ["হলিডে", "bg-slate-100 text-slate-600"] };

// প্রতিটি শ্রেণির ড্যাশবোর্ড: ওই শ্রেণির সব শিক্ষার্থীর তালিকা, তাদের উপস্থিতি, সর্বশেষ ফল ও বকেয়া একনজরে
export default function ClassDashboard() {
  const st = useSettings(); const { x, n, money } = useLang();
  const [cls, setCls] = useState(""); const [section, setSection] = useState(""); const [d, setD] = useState(null); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false); const [q, setQ] = useState(""); const [print, setPrint] = useState(false); const [sort, setSort] = useState("roll");
  useEffect(() => { if (st && !cls) setCls(st.classes[0]?.name || ""); }, [st, cls]);
  useEffect(() => { if (!cls) return; (async () => { setLoading(true); setErr(""); const r = await api("GET", `/api/class-dashboard?class=${encodeURIComponent(cls)}${section ? `&section=${encodeURIComponent(section)}` : ""}`); if (r.ok) setD(r.d); else { setD(null); setErr(r.d.error || x("লোড করা যায়নি")); } setLoading(false); })(); }, [cls, section]); // eslint-disable-line
  if (!st) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const secs = st.classes.find((c) => c.name === cls)?.sections || [];
  const P = (v) => (v === null || v === undefined ? "—" : n(v) + "%");
  const sm = d?.summary;
  let list = (d?.students || []).filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || String(s.roll) === q.trim() || s.studentId.includes(q.trim()));
  if (sort === "att") list = [...list].sort((a, b) => (a.att.year.pct ?? 101) - (b.att.year.pct ?? 101));
  if (sort === "result") list = [...list].sort((a, b) => (b.latest?.percent ?? -1) - (a.latest?.percent ?? -1));
  const tile = (label, val, tone = "text-brand-dark", sub) => <div className="card text-center"><p className="text-sm text-slate-600">{label}</p><p className={`font-display text-3xl ${tone}`}>{val}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("ক্লাস ড্যাশবোর্ড")}</h1>
        <select className="input !w-auto" value={cls} onChange={(e) => { setCls(e.target.value); setSection(""); }} aria-label={x("শ্রেণি")}>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select>
        {secs.length > 0 && <select className="input !w-auto" value={section} onChange={(e) => setSection(e.target.value)} aria-label={x("শাখা")}><option value="">{x("সব শাখা")}</option>{secs.map((s) => <option key={s}>{s}</option>)}</select>}
        <button className="btn-ghost" onClick={() => setPrint(true)}>{x("তালিকা প্রিন্ট")}</button>
        <Link className="btn-ghost" href="/admin/attendance/report">{x("হাজিরা রিপোর্ট")}</Link></div>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {loading && <Loader compact label={x("লোড হচ্ছে...")} />}
      {d && sm && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {tile(x("মোট শিক্ষার্থী"), n(sm.total))}
          {tile(x("আজ উপস্থিত"), n(sm.todayPresent), "text-brand", sm.todayUnmarked ? x("{0} জনের হাজিরা বাকি", sm.todayUnmarked) : undefined)}
          {tile(x("আজ অনুপস্থিত"), n(sm.todayAbsent), sm.todayAbsent ? "text-red-600" : "text-brand-dark", sm.todayLeave ? x("ছুটিতে {0} জন", sm.todayLeave) : undefined)}
          {tile(x("গড় উপস্থিতি (এ বছর)"), P(sm.avgAttendance), "text-brand-dark", sm.lowAttendance ? x("৭৫% এর কম: {0} জন", sm.lowAttendance) : undefined)}
          {tile(x("সর্বশেষ পরীক্ষার গড়"), P(sm.avgPercent), "text-brand-dark", sm.failing ? x("অকৃতকার্য: {0} জন", sm.failing) : undefined)}
        </div>
        <div className="flex flex-wrap items-center gap-3"><input className="input !w-64" placeholder={x("নাম, রোল বা আইডি খুঁজুন")} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}><option value="roll">{x("রোল অনুযায়ী")}</option><option value="att">{x("কম উপস্থিতি আগে")}</option><option value="result">{x("ভালো ফল আগে")}</option></select>
          {sm.totalDue !== undefined && <span className="ml-auto text-sm text-slate-600">{x("মোট বকেয়া")}: <b className={sm.totalDue > 0 ? "text-red-600" : "text-brand"}>{money(sm.totalDue)}</b></span>}</div>
        <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[820px]"><thead><tr>{[x("রোল"), x("নাম"), x("আজ"), x("উপস্থিতি (এ মাস)"), x("উপস্থিতি (এ বছর)"), x("অনুপস্থিত দিন"), x("সর্বশেষ ফল"), ...(sm.totalDue !== undefined ? [x("বকেয়া")] : [])].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{list.map((s) => { const low = s.att.year.pct !== null && s.att.year.pct < 75; return (
            <tr key={s._id}><td className="td">{n(s.roll)}</td>
              <td className="td"><Link href={`/admin/students/${s._id}`} className="flex items-center gap-2 font-semibold text-brand hover:underline">{s.photo ? <img src={s.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-light text-sm">{s.name[0]}</span>}<span>{s.name}<span className="block text-xs font-normal text-slate-500">{s.studentId}{s.section ? ` · ${s.section}` : ""}</span></span></Link></td>
              <td className="td">{s.today ? <span className={`rounded px-2 py-0.5 text-xs ${TODAY[s.today][1]}`}>{x(TODAY[s.today][0])}</span> : <span className="text-slate-400">—</span>}</td>
              <td className="td">{P(s.att.month.pct)}</td>
              <td className="td"><div className="flex items-center gap-2"><span className={`font-bold ${low ? "text-red-600" : "text-brand"}`}>{P(s.att.year.pct)}</span>{s.att.year.pct !== null && <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${low ? "bg-red-500" : "bg-brand"}`} style={{ width: `${s.att.year.pct}%` }} /></div>}</div></td>
              <td className="td">{n(s.att.year.absent)}{s.att.year.leave > 0 && <span className="text-xs text-slate-500"> ({x("ছুটি")} {n(s.att.year.leave)})</span>}</td>
              <td className="td">{s.latest ? <span><b className={s.latest.passed ? "text-brand" : "text-red-600"}>{s.latest.letter} · {P(s.latest.percent)}</b><span className="block text-xs text-slate-500">{s.latest.exam} {n(s.latest.year).replace(/[,،]/g, "")}</span></span> : <span className="text-slate-400">—</span>}</td>
              {sm.totalDue !== undefined && <td className={`td font-semibold ${s.due > 0 ? "text-red-600" : "text-brand"}`}>{s.due > 0 ? money(s.due) : "—"}</td>}</tr>); })}
            {list.length === 0 && !loading && <tr><td className="td py-8 text-center text-slate-500" colSpan={8}>{x("কোনো শিক্ষার্থী নেই")}</td></tr>}</tbody></table></div>
        <p className="text-xs text-slate-500">{x("উপস্থিতির হার = (উপস্থিত+দেরি) ÷ (উপস্থিত+দেরি+অনুপস্থিত); ছুটি/হলিডে হারে ধরা হয় না। ৭৫% এর কম হলে লাল দেখায়।")}</p>
      </>}
      {print && <StudentListPrint cls={cls} onClose={() => setPrint(false)} />}
    </div>
  );
}
