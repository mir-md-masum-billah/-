"use client";
import { useEffect, useState } from "react";
import useSettings from "@/hooks/useSettings";
import { api, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { confirmBox } from "@/components/Dialog";

export default function Promotion() {
  const st = useSettings(); const { x, n } = useLang();
  const [f, setF] = useState({ fromClass: "", fromSection: "", toClass: "", toSection: "", session: "", graduate: false });
  const [list, setList] = useState([]); const [sel, setSel] = useState({}); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [order, setOrder] = useState("name");
  const [perf, setPerf] = useState(false); const [exams, setExams] = useState([]); const [rankExam, setRankExam] = useState(""); const [ranked, setRanked] = useState(null); const [rBusy, setRBusy] = useState(false);
  useEffect(() => { if (st && !f.fromClass) setF((x) => ({ ...x, fromClass: st.classes[0]?.name || "", session: st.currentSession || "" })); }, [st]); // eslint-disable-line
  useEffect(() => {
    if (!f.fromClass) return;
    api("GET", `/api/students?class=${encodeURIComponent(f.fromClass)}${f.fromSection ? "&section=" + encodeURIComponent(f.fromSection) : ""}&active=true&limit=500`).then((r) => { if (r.ok) { setList(r.d.items); setSel(Object.fromEntries(r.d.items.map((s) => [s._id, true]))); } });
  }, [f.fromClass, f.fromSection, msg]);
  // পারফরম্যান্স অনুযায়ী রোল: এই শ্রেণির পরীক্ষার তালিকা (যে পরীক্ষায় ফল আছে)
  useEffect(() => { setRanked(null); if (!perf || !f.fromClass) return; api("GET", `/api/results/exams?class=${encodeURIComponent(f.fromClass)}`).then((r) => { if (r.ok) { setExams(r.d.items); setRankExam((c) => (r.d.items.some((e) => `${e.name}|${e.year}` === c) ? c : r.d.items[0] ? `${r.d.items[0].name}|${r.d.items[0].year}` : "")); } }); }, [perf, f.fromClass, f.fromSection, msg]); // eslint-disable-line
  if (!st) return <Loader compact label={x("লোড হচ্ছে...")} />;
  async function showRank() {
    setErr(""); setRBusy(true); const [exam, year] = rankExam.split("|");
    const r = await api("GET", `/api/students/promote/rank?class=${encodeURIComponent(f.fromClass)}${f.fromSection ? "&section=" + encodeURIComponent(f.fromSection) : ""}&exam=${encodeURIComponent(exam)}&year=${year}`); setRBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে"));
    setRanked(r.d); setSel(Object.fromEntries(r.d.items.map((s) => [s._id, s.passed]))); // উত্তীর্ণরা টিক-সহ, অকৃতকার্যরা বর্তমান শ্রেণিতে (শিক্ষক চাইলে বদলাতে পারেন)
  }
  const chosen = (perf && ranked ? ranked.items : list).filter((s) => sel[s._id]); const secs = (n) => st.classes.find((c) => c.name === n)?.sections || [];
  async function run() {
    setErr(""); setMsg("");
    if (!chosen.length) return setErr(x("কমপক্ষে একজন বাছাই করুন"));
    if (!(await confirmBox(perf && ranked && !f.graduate ? x("র‍্যাংক অনুযায়ী {0} জনকে {1} এ প্রমোশন ও নতুন রোল দেবেন? আপনি কি এই তালিকা অনুমোদন করছেন?", chosen.length, x(f.toClass)) : f.graduate ? x("{0} জনকে \"পাস করে বের\" করবেন? লগইন বন্ধ হবে।", chosen.length) : x("{0} জনকে {1} থেকে {2} এ প্রমোশন দেবেন?", chosen.length, x(f.fromClass), x(f.toClass))))) return;
    setBusy(true); const r = await api("POST", "/api/students/promote", { ...f, studentIds: chosen.map((s) => s._id), ...(perf && ranked && !f.graduate ? { rankBy: { exam: rankExam.split("|")[0], year: Number(rankExam.split("|")[1]) } } : {}) }); setBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে")); setMsg(f.graduate ? x("✅ {0} জনের পাস সম্পন্ন", r.d.moved) : x("✅ {0} জনের প্রমোশন সম্পন্ন", r.d.moved));
  }
  async function renumber() {
    setErr(""); const r = await api("POST", "/api/students/rolls", { class: f.fromClass, section: f.fromSection, order });
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে")); setMsg(x("✅ রোল পুনর্বিন্যাস: {0} জনের রোল বদলেছে", r.d.changed));
  }
  const sel1 = (k, opts, ph) => <select className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value, ...(k === "fromClass" ? { fromSection: "" } : {}), ...(k === "toClass" ? { toSection: "" } : {}) })}><option value="">{x(ph)}</option>{opts.map((o) => <option key={o} value={o}>{x(o)}</option>)}</select>;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl text-brand-dark">{x("প্রমোশন ও রোল")}</h1>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card space-y-4"><h2 className="font-bold">{x("শ্রেণি প্রমোশন")}</h2>
        <div className="grid gap-3 sm:grid-cols-4"><div><label className="label">{x("বর্তমান শ্রেণি")}</label>{sel1("fromClass", st.classes.map((c) => c.name), "—")}</div><div><label className="label">{x("শাখা")}</label>{sel1("fromSection", secs(f.fromClass), "সব")}</div>
          {!f.graduate && <><div><label className="label">{x("নতুন শ্রেণি")}</label>{sel1("toClass", st.classes.map((c) => c.name), "— বাছাই —")}</div><div><label className="label">{x("নতুন শাখা")}</label>{sel1("toSection", secs(f.toClass), "—")}</div><div><label className="label">{x("নতুন সেশন")}</label><input className="input" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value })} /></div></>}</div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.graduate} onChange={(e) => setF({ ...f, graduate: e.target.checked })} /> {x("শেষ শ্রেণি — পাস করে বের হচ্ছে (প্রমোশন নয়)")}</label>
        {!f.graduate && <div className="space-y-3 rounded-xl border border-gold/50 bg-gold-light/30 p-4">
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={perf} onChange={(e) => setPerf(e.target.checked)} /> {x("পারফরম্যান্স অনুযায়ী নতুন রোল (যে সবচেয়ে ভালো করেছে সে রোল ১)")}</label>
          {perf && <>
            <p className="text-sm text-slate-600">{x("সারা বছরের সব পরীক্ষার ফল (৮০%) ও হাজিরার হার (২০%) মিলিয়ে র‍্যাংক হয়। চূড়ান্ত পরীক্ষা বাছুন, র‍্যাংক দেখুন, যাচাই করে তারপর অনুমোদন দিন — অনুমোদন ছাড়া কিছুই বদলায় না। অকৃতকার্যরা বর্তমান শ্রেণিতে থাকে।")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <select className="input !w-auto" value={rankExam} onChange={(e) => { setRankExam(e.target.value); setRanked(null); }}>{exams.length === 0 && <option value="">{x("এই শ্রেণিতে কোনো পরীক্ষার ফল নেই")}</option>}{exams.map((e) => <option key={`${e.name}|${e.year}`} value={`${e.name}|${e.year}`}>{e.name} — {n(e.year).replace(/[,،]/g, "")}</option>)}</select>
              <button type="button" className="btn-ghost" disabled={!rankExam || rBusy} onClick={showRank}>{rBusy ? x("অপেক্ষা করুন...") : x("র‍্যাংক দেখুন")}</button></div>
            {ranked && !ranked.finalized && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{x("এই পরীক্ষার ফল এখনো চূড়ান্তভাবে প্রকাশিত হয়নি — প্রকাশের আগে প্রমোশন দেওয়া যাবে না।")}</p>}
          </>}</div>}
        {perf && ranked ? <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[640px]"><thead><tr><th className="th">{x("টিক")}</th><th className="th">{x("নতুন রোল")}</th><th className="th">{x("বর্তমান রোল")}</th><th className="th">{x("নাম")}</th><th className="th">{x("চূড়ান্ত পরীক্ষা")}</th><th className="th">{x("বছরের গড়")}</th><th className="th">{x("হাজিরা")}</th><th className="th">{x("স্কোর")}</th></tr></thead>
          <tbody>{(() => { let k = 0; return ranked.items.map((s) => { const on = !!sel[s._id]; if (on) k++; return <tr key={s._id} className={on ? "" : "bg-slate-50 text-slate-400"}><td className="td"><input type="checkbox" checked={on} onChange={(e) => setSel({ ...sel, [s._id]: e.target.checked })} /></td><td className="td font-bold text-brand">{on ? n(k) : "—"}</td><td className="td">{n(s.roll)}</td><td className="td">{s.name}{s.section ? ` (${s.section})` : ""}</td><td className="td">{s.hasFinal ? <span className={s.passed ? "" : "font-semibold text-red-600"}>{n(s.finalPercent)}% {s.passed ? "" : `· ${x("অকৃতকার্য")}`}</span> : <span className="text-red-600">{x("ফল নেই")}</span>}</td><td className="td">{n(s.avgPct)}%</td><td className="td">{s.attPct === null ? "—" : `${n(s.attPct)}%`}</td><td className="td font-semibold">{n(s.score)}</td></tr>; }); })()}</tbody></table></div> :
        <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[420px]"><thead><tr><th className="th"><input type="checkbox" aria-label={x("সব")} checked={chosen.length === list.length && list.length > 0} onChange={(e) => setSel(Object.fromEntries(list.map((s) => [s._id, e.target.checked])))} /></th><th className="th">{x("রোল")}</th><th className="th">{x("নাম")}</th><th className="th">{x("শাখা")}</th></tr></thead>
          <tbody>{list.map((s) => <tr key={s._id}><td className="td"><input type="checkbox" checked={!!sel[s._id]} onChange={(e) => setSel({ ...sel, [s._id]: e.target.checked })} /></td><td className="td">{n(s.roll)}</td><td className="td">{s.name}</td><td className="td">{s.section || "—"}</td></tr>)}{!list.length && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>{x("কোনো সক্রিয় শিক্ষার্থী নেই")}</td></tr>}</tbody></table></div>}
        <p className="text-sm text-slate-600">{x("টিক ওঠা {0} জন যাবে। যাদের টিক সরাবেন (অকৃতকার্য) তারা বর্তমান শ্রেণিতেই থাকবে। রোল নতুন শ্রেণির শেষ রোলের পর থেকে ক্রমানুসারে বসবে।", chosen.length)}</p>
        <button className="btn-primary" disabled={busy || (!f.graduate && !f.toClass) || (perf && !f.graduate && (!ranked || !ranked.finalized))} onClick={run}>{busy ? x("অপেক্ষা করুন...") : f.graduate ? x("পাস সম্পন্ন করুন") : perf ? x("অনুমোদন দিয়ে প্রমোশন দিন") : x("প্রমোশন দিন")}</button></div>
      <div className="card space-y-3"><h2 className="font-bold">{x("রোল পুনর্বিন্যাস")} ({x(f.fromClass)}{f.fromSection && ` — ${f.fromSection}`})</h2>
        <div className="flex flex-wrap items-center gap-3"><select className="input !w-auto" value={order} onChange={(e) => setOrder(e.target.value)}><option value="name">{x("নামের বর্ণানুক্রমে")}</option><option value="roll">{x("বর্তমান রোলের ক্রমে (ফাঁক ভরাট)")}</option></select><button className="btn-ghost" onClick={() => confirmBox(x("রোল বদলে যাবে। নিশ্চিত?")).then((ok) => ok && renumber())}>{x("১ থেকে নতুন রোল দিন")}</button></div></div>
      <Toast msg={msg} />
    </div>
  );
}
