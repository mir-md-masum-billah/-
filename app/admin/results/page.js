"use client";
import { useEffect, useMemo, useState } from "react";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import { api, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import { yearDhaka } from "@/lib/dates";
import { printUrl } from "@/lib/print";
import Loader from "@/components/Loader";
import { confirmBox } from "@/components/Dialog";
import { summarize } from "@/lib/grades";

// পরীক্ষার ফলাফল: শ্রেণি → পরীক্ষা/সেমিস্টার (নোটিশ থেকে বাছাই) → নম্বর লিখুন → সংরক্ষণ → একবার চূড়ান্ত প্রকাশ। প্রকাশের পর শুধু নম্বর সংশোধন চলে, পুনরায় প্রকাশ/প্রত্যাহার নেই।
export default function Page() {
  const { x, n } = useLang(); const st = useSettings(); const me = useMe();
  const [cls, setCls] = useState(""); const [sec, setSec] = useState(""); const [exam, setExam] = useState(""); const [year, setYear] = useState(yearDhaka());
  const [exams, setExams] = useState(null); const [sheet, setSheet] = useState(null); const [vals, setVals] = useState({}); const [busy, setBusy] = useState(false); const [toast, setToast] = useState(""); const [err, setErr] = useState("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  useEffect(() => {
    setExams(null); if (!cls) return;
    api("GET", `/api/results/exams?class=${encodeURIComponent(cls)}`).then((r) => setExams(r.ok ? r.d.items : []));
  }, [cls]);
  const load = async () => {
    if (!cls) return setSheet(null);
    setErr(""); const r = await api("GET", `/api/results/sheet?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(sec)}&exam=${encodeURIComponent(exam.trim())}&year=${year}`);
    if (!r.ok) return setErr(r.d.error || x("লোড করা যায়নি"));
    setSheet(r.d); const v = {}; for (const [sid, m] of Object.entries(r.d.marks)) for (const [sub, o] of Object.entries(m)) v[`${sid}|${sub}`] = String(o.marks); setVals(v);
  };
  useEffect(() => { load(); }, [cls, sec, exam, year]); // eslint-disable-line
  const subjects = sheet?.subjects || [];
  const pickExam = (k) => { setSheet(null); if (!k) return setExam(""); const e = exams.find((y) => `${y.name}|${y.year}` === k); if (e) { setExam(e.name); setYear(e.year); } };
  const examKey = exams?.find((y) => y.name === exam && y.year === year) ? `${exam}|${year}` : "";
  const can = (p) => me?.perms.includes(p);
  const dirty = useMemo(() => Object.keys(vals).length, [vals]);
  const pos = useMemo(() => { if (!sheet) return {}; const rs = sheet.students.map((s) => { const rows = []; for (const sub of subjects) { if (!s.subjects.includes(sub.name)) continue; const v = vals[`${s._id}|${sub.name}`]; if (v === undefined || v === "" || Number.isNaN(Number(v))) continue; rows.push({ marks: Number(v), full: sub.full }); } return rows.length ? { id: s._id, ...summarize(rows) } : null; }).filter(Boolean); rs.sort((a, b) => Number(b.passed) - Number(a.passed) || b.total - a.total || b.gpa - a.gpa); const o = {}; rs.forEach((r) => { o[r.id] = 1 + rs.findIndex((q) => q.passed === r.passed && q.total === r.total && q.gpa === r.gpa); }); return o; }, [sheet, vals, subjects]); // eslint-disable-line
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
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে")); flash("✅ " + x("ফলাফল প্রকাশিত — শিক্ষার্থীরা এখন দেখতে পাবে")); load();
  }
  const status = sheet?.status; const finalized = !!status?.finalized;
  async function doPublish() {
    if (!(await confirmBox(x("\"{0}\" ফলাফল চূড়ান্তভাবে প্রকাশ করবেন? প্রকাশের পর শিক্ষার্থীরা ফল দেখতে পাবে। এটি আর প্রত্যাহার বা নতুন করে প্রকাশ করা যাবে না — শুধু নম্বর সংশোধন করা যাবে।", exam)))) return;
    publish(true);
  }
  // সারির লাইভ মোট ও জিপিএ (লেখার সাথে সাথে হিসাব)
  // মেধাক্রম (উত্তীর্ণরা আগে, তারপর মোট নম্বর/জিপিএ; সমান হলে একই ক্রম) — লেখার সাথে সাথে হিসাব
  const live = (s) => { const rows = []; for (const sub of subjects) { if (!s.subjects.includes(sub.name)) continue; const v = vals[`${s._id}|${sub.name}`]; if (v === undefined || v === "" || Number.isNaN(Number(v))) continue; rows.push({ marks: Number(v), full: sub.full }); } return rows.length ? summarize(rows) : null; };
  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-brand-dark">{x("পরীক্ষার ফলাফল")}</h1>
      <div className="card grid gap-3 sm:grid-cols-4">
        <div><label className="label">{x("শ্রেণি")}</label><select className="input" value={cls} onChange={(e) => { setCls(e.target.value); setSec(""); setExam(""); setSheet(null); }}><option value="">{x("— বাছাই করুন —")}</option>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select></div>
        <div><label className="label">{x("শাখা")}</label><select className="input" value={sec} onChange={(e) => setSec(e.target.value)}><option value="">{x("সব শাখা")}</option>{secs.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label">{x("পরীক্ষা / সেমিস্টার")}</label><select className="input" disabled={!cls || !exams} value={examKey} onChange={(e) => pickExam(e.target.value)}><option value="">{!cls ? x("আগে শ্রেণি বাছাই করুন") : !exams ? x("লোড হচ্ছে...") : exams.length ? x("— পরীক্ষা বাছাই করুন —") : x("এই শ্রেণির কোনো পরীক্ষা নেই")}</option>{(exams || []).map((e) => <option key={`${e.name}|${e.year}`} value={`${e.name}|${e.year}`}>{e.name} — {n(e.year)}{e.finalSections.includes("") ? ` ✓ ${x("প্রকাশিত")}` : ""}</option>)}</select></div>
        <div><label className="label">{x("বছর")}</label><input className="input" type="number" value={year} readOnly disabled /></div>
      </div>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {cls && <div className="flex justify-end"><button className="btn-ghost" onClick={() => printUrl(`/admin/results/class-all?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(sec)}&year=${year}`)}>{x("এই শ্রেণির সব পরীক্ষার ফল একসাথে প্রিন্ট")}</button></div>}
      {!cls ? <p className="card text-slate-500">{x("শ্রেণি ও পরীক্ষা বেছে নম্বর লিখুন।")}</p> : !exam ? <p className="card text-slate-500">{exams && !exams.length ? x("এই শ্রেণির জন্য আগে \"পরীক্ষার নোটিশ\" পেজ থেকে পরীক্ষা (সেমিস্টার) তৈরি করুন — তারপর এখানে ফল দেওয়া যাবে।") : x("উপরে থেকে পরীক্ষা/সেমিস্টার বাছাই করুন।")}</p> : !sheet ? <Loader compact label={x("লোড হচ্ছে...")} /> : <>
        <div className="flex flex-wrap items-center gap-3">
          {status?.total > 0 && <span className={`rounded-full px-3 py-1 text-sm font-semibold ${finalized ? "bg-brand-light text-brand" : "bg-amber-100 text-amber-800"}`}>{finalized ? x("চূড়ান্তভাবে প্রকাশিত — শুধু সংশোধন করা যাবে") : x("অপ্রকাশিত নম্বর আছে")}</span>}
          <span className="ml-auto flex flex-wrap gap-2">
            {status?.total > 0 && <button className="btn-ghost" onClick={() => printUrl(`/admin/results/merit?class=${encodeURIComponent(cls)}&section=${encodeURIComponent(sec)}&exam=${encodeURIComponent(exam.trim())}&year=${year}`)}>{x("মেধা তালিকা প্রিন্ট")}</button>}
            {can("results.write") && <button className="btn-primary" disabled={busy || !exam.trim()} onClick={save}>{busy ? x("অপেক্ষা করুন...") : finalized ? x("সংশোধন সংরক্ষণ") : x("নম্বর সংরক্ষণ")}</button>}
            {can("results.publish") && status?.total > 0 && !finalized && <button className="btn-gold" disabled={busy} onClick={doPublish}>{x("ফলাফল চূড়ান্ত প্রকাশ করুন")}</button>}
          </span>
        </div>
        {sheet.students.length === 0 ? <p className="card text-slate-500">{x("এই শ্রেণিতে কোনো শিক্ষার্থী নেই")}</p> : subjects.length === 0 ? <p className="card text-slate-500">{x("এই শ্রেণিতে কোনো বিষয় নেই — আগে \"শ্রেণি-বিষয়-নিয়োগ\" থেকে বিষয় যোগ করুন")}</p> :
          <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[640px] border-collapse">
            <thead><tr><th className="th">{x("রোল")}</th><th className="th">{x("নাম")}</th>{subjects.map((s) => <th key={s._id} className="th text-center">{x(s.name)}<span className="block text-xs font-normal text-slate-500">/{n(s.full)}</span></th>)}<th className="th text-center">{x("মোট")}</th><th className="th text-center">{x("জিপিএ")}</th><th className="th text-center">{x("গ্রেড")}</th><th className="th text-center">{x("মেধাক্রম")}</th><th className="th" /></tr></thead>
            <tbody>{sheet.students.map((s) => <tr key={s._id}><td className="td">{n(s.roll)}</td><td className="td font-semibold">{s.name}</td>
              {subjects.map((sub) => { const on = s.subjects.includes(sub.name); const k = `${s._id}|${sub.name}`; return <td key={sub._id} className="td text-center">{!on ? <span className="text-slate-300" title={x("এই বিষয় বন্ধ")}>—</span> : <input type="number" min="0" max={sub.full} step="0.5" disabled={!sub.editable} className="input !w-20 !px-2 !py-1.5 text-center" value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />}</td>; })}
              {(() => { const m = live(s); return <><td className="td text-center font-semibold">{m ? n(m.total) : "—"}</td><td className={`td text-center font-bold ${m && !m.passed ? "text-red-600" : "text-brand"}`}>{m ? n(m.gpa.toFixed(2)) : "—"}</td><td className={`td text-center font-bold ${m && !m.passed ? "text-red-600" : "text-brand"}`}>{m ? m.letter : "—"}</td><td className="td text-center font-semibold">{pos[s._id] ? n(pos[s._id]) : "—"}</td></>; })()}<td className="td whitespace-nowrap text-right">{exam.trim() && sheet.marks[s._id] && <button className="font-semibold text-brand" onClick={() => printUrl(`/admin/results/card?student=${s._id}&exam=${encodeURIComponent(exam.trim())}&year=${year}`)}>{x("কার্ড প্রিন্ট")}</button>}</td></tr>)}</tbody>
          </table></div>}
      </>}
      <Toast msg={toast} />
    </div>
  );
}
