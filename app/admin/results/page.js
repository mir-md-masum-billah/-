"use client";
import { useEffect, useMemo, useState } from "react";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import { api, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import { yearDhaka } from "@/lib/dates";
import { printUrl } from "@/lib/print";
import Loader from "@/components/Loader";

// পরীক্ষার ফলাফল: শ্রেণি + পরীক্ষা বেছে বিষয়ভিত্তিক নম্বর লিখুন → সংরক্ষণ → প্রকাশ করলে শিক্ষার্থী নিজের ফল ও রেজাল্ট কার্ড দেখবে
export default function Page() {
  const { x, n } = useLang(); const st = useSettings(); const me = useMe();
  const [cls, setCls] = useState(""); const [sec, setSec] = useState(""); const [exam, setExam] = useState(""); const [year, setYear] = useState(yearDhaka());
  const [sheet, setSheet] = useState(null); const [vals, setVals] = useState({}); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(""); const [err, setErr] = useState("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const load = async () => {
    if (!cls) return setSheet(null);
    setErr(""); const r = await api("GET", `/api/results/sheet?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(sec)}&exam=${encodeURIComponent(exam.trim())}&year=${year}`);
    if (!r.ok) return setErr(r.d.error || x("লোড করা যায়নি"));
    setSheet(r.d); const v = {}; for (const [sid, m] of Object.entries(r.d.marks)) for (const [sub, o] of Object.entries(m)) v[`${sid}|${sub}`] = String(o.marks); setVals(v);
  };
  useEffect(() => { load(); }, [cls, sec, exam, year]); // eslint-disable-line
  const subjects = sheet?.subjects || [];
  const can = (p) => me?.perms.includes(p);
  const dirty = useMemo(() => Object.keys(vals).length, [vals]);
  if (!st || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const secs = st.classes.find((c) => c.name === cls)?.sections || [];
  async function save() {
    if (exam.trim().length < 2) return setErr(x("পরীক্ষার নাম দিন"));
    const rows = []; for (const s of sheet.students) for (const sub of subjects) { const v = vals[`${s._id}|${sub.name}`]; if (v !== undefined && v !== "" && sub.editable && s.subjects.includes(sub.name)) rows.push({ student: s._id, subject: sub.name, marks: v, full: sub.full }); }
    if (!rows.length) return setErr(x("কোনো নম্বর লেখা হয়নি"));
    setBusy(true); setErr(""); const r = await api("POST", "/api/results/bulk", { exam: exam.trim(), year, class: cls, rows }); setBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সংরক্ষণ ব্যর্থ")); flash("✅ " + x("সংরক্ষিত — নতুন {0}, সংশোধিত {1}", r.d.saved, r.d.changed)); load();
  }
  async function publish(p) {
    setBusy(true); setErr(""); const r = await api("POST", "/api/results/publish", { exam: exam.trim(), year, class: cls, section: sec, publish: p }); setBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে")); flash(p ? "✅ " + x("ফলাফল প্রকাশিত — শিক্ষার্থীরা এখন দেখতে পাবে") : "✅ " + x("ফলাফল প্রত্যাহার করা হয়েছে")); load();
  }
  const status = sheet?.status; const allPub = status && status.total > 0 && status.unpublished === 0;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-brand-dark">{x("পরীক্ষার ফলাফল")}</h1>
      <div className="card grid gap-3 sm:grid-cols-4">
        <div><label className="label">{x("শ্রেণি")}</label><select className="input" value={cls} onChange={(e) => { setCls(e.target.value); setSec(""); }}><option value="">{x("— বাছাই করুন —")}</option>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select></div>
        <div><label className="label">{x("শাখা")}</label><select className="input" value={sec} onChange={(e) => setSec(e.target.value)}><option value="">{x("সব শাখা")}</option>{secs.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label">{x("পরীক্ষার নাম (যেমন: অর্ধবার্ষিক)")}</label><input className="input" value={exam} onChange={(e) => setExam(e.target.value)} /></div>
        <div><label className="label">{x("বছর")}</label><input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
      </div>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {!cls ? <p className="card text-slate-500">{x("শ্রেণি ও পরীক্ষার নাম বেছে নম্বর লিখুন।")}</p> : !sheet ? <Loader compact label={x("লোড হচ্ছে...")} /> : <>
        <div className="flex flex-wrap items-center gap-3">
          {status?.total > 0 && <span className={`rounded-full px-3 py-1 text-sm font-semibold ${allPub ? "bg-brand-light text-brand" : "bg-amber-100 text-amber-800"}`}>{allPub ? x("প্রকাশিত") : x("অপ্রকাশিত নম্বর আছে")}</span>}
          <span className="ml-auto flex flex-wrap gap-2">
            {can("results.write") && <button className="btn-primary" disabled={busy || !exam.trim()} onClick={save}>{busy ? x("অপেক্ষা করুন...") : x("নম্বর সংরক্ষণ")}</button>}
            {can("results.publish") && status?.total > 0 && !allPub && <button className="btn-gold" disabled={busy} onClick={() => publish(true)}>{x("ফলাফল প্রকাশ করুন")}</button>}
            {can("results.publish") && allPub && <button className="btn-ghost" disabled={busy} onClick={() => publish(false)}>{x("প্রকাশ প্রত্যাহার")}</button>}
          </span>
        </div>
        {sheet.students.length === 0 ? <p className="card text-slate-500">{x("এই শ্রেণিতে কোনো শিক্ষার্থী নেই")}</p> : subjects.length === 0 ? <p className="card text-slate-500">{x("এই শ্রেণিতে কোনো বিষয় নেই — আগে \"শ্রেণি-বিষয়-নিয়োগ\" থেকে বিষয় যোগ করুন")}</p> :
          <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[640px] border-collapse">
            <thead><tr><th className="th">{x("রোল")}</th><th className="th">{x("নাম")}</th>{subjects.map((s) => <th key={s._id} className="th text-center">{x(s.name)}<span className="block text-xs font-normal text-slate-500">/{n(s.full)}</span></th>)}<th className="th" /></tr></thead>
            <tbody>{sheet.students.map((s) => <tr key={s._id}><td className="td">{n(s.roll)}</td><td className="td font-semibold">{s.name}</td>
              {subjects.map((sub) => { const on = s.subjects.includes(sub.name); const k = `${s._id}|${sub.name}`; return <td key={sub._id} className="td text-center">{!on ? <span className="text-slate-300" title={x("এই বিষয় বন্ধ")}>—</span> : <input type="number" min="0" max={sub.full} step="0.5" disabled={!sub.editable} className="input !w-20 !px-2 !py-1.5 text-center" value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />}</td>; })}
              <td className="td whitespace-nowrap text-right">{exam.trim() && sheet.marks[s._id] && <button className="font-semibold text-brand" onClick={() => printUrl(`/admin/results/card?student=${s._id}&exam=${encodeURIComponent(exam.trim())}&year=${year}`)}>{x("কার্ড প্রিন্ট")}</button>}</td></tr>)}</tbody>
          </table></div>}
        {sheet.students.length > 0 && <p className="text-sm text-slate-500">{x("ধূসর ঘর = এই বিষয়ে আপনি নম্বর দিতে নিযুক্ত নন। ফাঁকা ঘর বাদ যায়। প্রকাশ না করা পর্যন্ত শিক্ষার্থী ফল দেখবে না।")}</p>}
      </>}
      <Toast msg={toast} />
    </div>
  );
}
