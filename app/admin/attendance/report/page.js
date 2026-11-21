"use client";
import { useEffect, useState } from "react";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import { api } from "@/components/CrudPage";
import { todayDhaka } from "@/lib/dates";
import { months } from "@/lib/school";
import { toCSV, download } from "@/lib/csv";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { printUrl } from "@/lib/print";

export default function Report() {
  const st = useSettings(); const me = useMe(); const { x, n, date: fmtDate } = useLang();
  const P = (v) => (v === null || v === undefined ? "—" : n(v) + "%");
  const [type, setType] = useState("student"); const [cls, setCls] = useState(""); const [section, setSection] = useState("");
  const [mode, setMode] = useState("month"); const [month, setMonth] = useState(todayDhaka().slice(0, 7)); const [year, setYear] = useState(todayDhaka().slice(0, 4)); const [date, setDate] = useState(todayDhaka());
  const [d, setD] = useState(null); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { if (st && !cls) setCls(st.classes[0]?.name || ""); }, [st, cls]);
  useEffect(() => {
    if (!st || !me || (type !== "staff" && !cls)) return;
    (async () => {
      setLoading(true); setErr("");
      const q = type === "absent" ? `type=absent&date=${date}&class=${encodeURIComponent(cls)}` : `type=${type}${type === "student" ? `&class=${encodeURIComponent(cls)}${section ? "&section=" + encodeURIComponent(section) : ""}` : ""}&${mode === "year" ? "year=" + year : "month=" + month}`;
      const r = await api("GET", `/api/reports/attendance?${q}`);
      if (r.ok) setD(r.d); else { setD(null); setErr(r.d.error || x("রিপোর্ট আনা যায়নি")); }
      setLoading(false);
    })();
  }, [st, me, type, cls, section, mode, month, year, date]);
  if (!st || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const tabs = [["student", x("শিক্ষার্থী")], ...(me.perms.includes("staffattendance.read") ? [["staff", x("স্টাফ")]] : []), ["absent", x("অনুপস্থিতের তালিকা")]];
  const fmtYear = (y) => (/^\d+$/.test(String(y)) ? n(Number(y)).replace(/[,،]/g, "") : y);
  const period = mode === "year" ? x("{0} সাল", fmtYear(year)) : `${x(months[Number(month.slice(5)) - 1])} ${fmtYear(month.slice(0, 4))}`;
  const rows = d?.rows || [];
  const exportCsv = () => download(`attendance-${type}-${mode === "year" ? year : month}.csv`, toCSV(rows.map((r) => ({ name: r.student?.name || r.person?.name, roll: r.student?.roll ?? "", present: r.present, absent: r.absent, late: r.late, leave: r.leave, holiday: r.holiday, unmarked: r.unmarked, percent: r.pct ?? "" })), ["name", "roll", "present", "absent", "late", "leave", "holiday", "unmarked", "percent"]));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden"><h1 className="mr-auto text-3xl text-brand-dark">{x("হাজিরা রিপোর্ট")}</h1>
        {type !== "absent" && rows.length > 0 && <button className="btn-ghost" onClick={exportCsv}>CSV</button>}<button className="btn-ghost" onClick={() => printUrl(`/admin/attendance/report/print?type=${type}&cls=${encodeURIComponent(cls)}&section=${encodeURIComponent(section)}&mode=${mode}&month=${month}&year=${year}&date=${date}`)}>{x("প্রিন্ট")}</button></div>
      <div className="mb-4 flex gap-2 border-b print:hidden">{tabs.map(([k, l]) => <button key={k} onClick={() => { setType(k); setD(null); }} className={`px-4 py-2 font-semibold ${type === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{l}</button>)}</div>
      <div className="mb-4 flex flex-wrap gap-3 print:hidden">
        {type !== "staff" && <select className="input !w-auto" value={cls} onChange={(e) => { setCls(e.target.value); setSection(""); }} aria-label={x("শ্রেণি")}>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select>}
        {type === "student" && (st.classes.find((c) => c.name === cls)?.sections || []).length > 0 && <select className="input !w-auto" value={section} onChange={(e) => setSection(e.target.value)} aria-label={x("শাখা")}><option value="">{x("সব শাখা")}</option>{st.classes.find((c) => c.name === cls).sections.map((sc) => <option key={sc}>{sc}</option>)}</select>}
        {type === "absent" ? <input type="date" className="input !w-auto" value={date} max={todayDhaka()} onChange={(e) => e.target.value && setDate(e.target.value)} /> : <>
          <select className="input !w-auto" value={mode} onChange={(e) => setMode(e.target.value)}><option value="month">{x("মাসিক")}</option><option value="year">{x("বার্ষিক")}</option></select>
          {mode === "month" ? <input type="month" className="input !w-auto" value={month} max={todayDhaka().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} /> : <input type="number" className="input !w-28" value={year} onChange={(e) => setYear(e.target.value)} />}</>}
      </div>
      {err && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="hidden print:block"><h2 className="text-xl font-bold">{st.schoolName}</h2><p>{type === "absent" ? x("অনুপস্থিতের তালিকা — {0}", fmtDate(date)) : x("{0} হাজিরা রিপোর্ট — {1}{2}", type === "staff" ? x("স্টাফ") : x("শিক্ষার্থী"), type === "student" ? x(cls) + " · " : "", period)}</p></div>
      {loading && <Loader compact label={x("লোড হচ্ছে...")} />}
      {d && type === "absent" && <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[480px]"><thead><tr>{["শ্রেণি", "রোল", "নাম", "অভিভাবকের ফোন"].map((h) => <th key={h} className="th">{x(h)}</th>)}</tr></thead>
        <tbody>{d.items.map((i) => <tr key={i._id}><td className="td">{x(i.student.class)}</td><td className="td">{n(i.student.roll)}</td><td className="td">{i.student.name}</td><td className="td">{i.student.guardianPhone || i.student.phone || "—"}</td></tr>)}{d.items.length === 0 && <tr><td className="td py-8 text-center text-slate-500" colSpan={4}>{x("এই দিনে কেউ অনুপস্থিত নেই (বা হাজিরা নেওয়া হয়নি)")}</td></tr>}</tbody></table></div>}
      {d && type !== "absent" && <>
        <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[640px]"><thead><tr>{[type === "staff" ? "নাম" : "রোল", ...(type === "staff" ? [] : ["নাম"]), "উপস্থিত", "অনুপস্থিত", "দেরি", "ছুটি", "হলিডে", "অচিহ্নিত", "হার"].map((h) => <th key={h} className="th">{x(h)}</th>)}{mode === "year" && type === "student" && months.map((m) => <th key={m} className="th text-xs">{x(m).slice(0, 3)}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={(r.student || r.person)._id}>{type === "staff" ? <td className="td">{r.person.name}</td> : <><td className="td">{n(r.student.roll)}</td><td className="td">{r.student.name}</td></>}<td className="td">{n(r.present)}</td><td className={`td ${r.absent ? "font-bold text-red-600" : ""}`}>{n(r.absent)}</td><td className="td">{n(r.late)}</td><td className="td">{n(r.leave)}</td><td className="td">{n(r.holiday)}</td><td className={`td ${r.unmarked ? "text-amber-700" : ""}`}>{n(r.unmarked)}</td><td className="td font-bold">{P(r.pct)}</td>{r.months && r.months.map((m, i) => <td key={i} className="td text-xs">{m === null ? "—" : n(m)}</td>)}</tr>)}
            {rows.length === 0 && <tr><td className="td py-8 text-center text-slate-500" colSpan={10}>{x("তথ্য নেই")}</td></tr>}</tbody></table></div>
        <div className="mt-12 hidden justify-between print:flex"><span className="border-t border-slate-500 px-8 pt-1">{x("ক্লাস টিচার")}</span><span className="border-t border-slate-500 px-8 pt-1">{x("প্রধান শিক্ষক")}</span></div></>}
    </div>
  );
}
