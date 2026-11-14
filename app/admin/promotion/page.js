"use client";
import { useEffect, useState } from "react";
import useSettings from "@/hooks/useSettings";
import { api, Toast } from "@/components/CrudPage";

export default function Promotion() {
  const st = useSettings();
  const [f, setF] = useState({ fromClass: "", fromSection: "", toClass: "", toSection: "", session: "", graduate: false });
  const [list, setList] = useState([]); const [sel, setSel] = useState({}); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [order, setOrder] = useState("name");
  useEffect(() => { if (st && !f.fromClass) setF((x) => ({ ...x, fromClass: st.classes[0]?.name || "", session: st.currentSession || "" })); }, [st]); // eslint-disable-line
  useEffect(() => {
    if (!f.fromClass) return;
    api("GET", `/api/students?class=${encodeURIComponent(f.fromClass)}${f.fromSection ? "&section=" + encodeURIComponent(f.fromSection) : ""}&active=true&limit=500`).then((r) => { if (r.ok) { setList(r.d.items); setSel(Object.fromEntries(r.d.items.map((s) => [s._id, true]))); } });
  }, [f.fromClass, f.fromSection, msg]);
  if (!st) return <p>লোড হচ্ছে...</p>;
  const chosen = list.filter((s) => sel[s._id]); const secs = (n) => st.classes.find((c) => c.name === n)?.sections || [];
  async function run() {
    setErr(""); setMsg("");
    if (!chosen.length) return setErr("কমপক্ষে একজন বাছাই করুন");
    if (!confirm(f.graduate ? `${chosen.length} জনকে "পাস করে বের" করবেন? লগইন বন্ধ হবে।` : `${chosen.length} জনকে ${f.fromClass} থেকে ${f.toClass} এ প্রমোশন দেবেন?`)) return;
    setBusy(true); const r = await api("POST", "/api/students/promote", { ...f, studentIds: chosen.map((s) => s._id) }); setBusy(false);
    if (!r.ok) return setErr(r.d.error || "সমস্যা হয়েছে"); setMsg(`✅ ${r.d.moved} জনের ${f.graduate ? "পাস সম্পন্ন" : "প্রমোশন সম্পন্ন"}`);
  }
  async function renumber() {
    setErr(""); const r = await api("POST", "/api/students/rolls", { class: f.fromClass, section: f.fromSection, order });
    if (!r.ok) return setErr(r.d.error || "সমস্যা হয়েছে"); setMsg(`✅ রোল পুনর্বিন্যাস: ${r.d.changed} জনের রোল বদলেছে`);
  }
  const sel1 = (k, opts, ph) => <select className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value, ...(k === "fromClass" ? { fromSection: "" } : {}), ...(k === "toClass" ? { toSection: "" } : {}) })}><option value="">{ph}</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">প্রমোশন ও রোল</h1>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card space-y-4"><h2 className="font-bold">শ্রেণি প্রমোশন</h2>
        <div className="grid gap-3 sm:grid-cols-4"><div><label className="label">বর্তমান শ্রেণি</label>{sel1("fromClass", st.classes.map((c) => c.name), "—")}</div><div><label className="label">শাখা</label>{sel1("fromSection", secs(f.fromClass), "সব")}</div>
          {!f.graduate && <><div><label className="label">নতুন শ্রেণি</label>{sel1("toClass", st.classes.map((c) => c.name), "— বাছাই —")}</div><div><label className="label">নতুন শাখা</label>{sel1("toSection", secs(f.toClass), "—")}</div><div><label className="label">নতুন সেশন</label><input className="input" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value })} /></div></>}</div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.graduate} onChange={(e) => setF({ ...f, graduate: e.target.checked })} /> শেষ শ্রেণি — পাস করে বের হচ্ছে (প্রমোশন নয়)</label>
        <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[420px]"><thead><tr><th className="th"><input type="checkbox" aria-label="সব" checked={chosen.length === list.length && list.length > 0} onChange={(e) => setSel(Object.fromEntries(list.map((s) => [s._id, e.target.checked])))} /></th><th className="th">রোল</th><th className="th">নাম</th><th className="th">শাখা</th></tr></thead>
          <tbody>{list.map((s) => <tr key={s._id}><td className="td"><input type="checkbox" checked={!!sel[s._id]} onChange={(e) => setSel({ ...sel, [s._id]: e.target.checked })} /></td><td className="td">{s.roll}</td><td className="td">{s.name}</td><td className="td">{s.section || "—"}</td></tr>)}{!list.length && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>কোনো সক্রিয় শিক্ষার্থী নেই</td></tr>}</tbody></table></div>
        <p className="text-sm text-slate-600">টিক ওঠা {chosen.length} জন যাবে। যাদের টিক সরাবেন (অকৃতকার্য) তারা বর্তমান শ্রেণিতেই থাকবে। রোল নতুন শ্রেণির শেষ রোলের পর থেকে ক্রমানুসারে বসবে।</p>
        <button className="btn-primary" disabled={busy || (!f.graduate && !f.toClass)} onClick={run}>{busy ? "অপেক্ষা করুন..." : f.graduate ? "পাস সম্পন্ন করুন" : "প্রমোশন দিন"}</button></div>
      <div className="card space-y-3"><h2 className="font-bold">রোল পুনর্বিন্যাস ({f.fromClass}{f.fromSection && ` — ${f.fromSection}`})</h2>
        <div className="flex flex-wrap items-center gap-3"><select className="input !w-auto" value={order} onChange={(e) => setOrder(e.target.value)}><option value="name">নামের বর্ণানুক্রমে</option><option value="roll">বর্তমান রোলের ক্রমে (ফাঁক ভরাট)</option></select><button className="btn-ghost" onClick={() => confirm("রোল বদলে যাবে। নিশ্চিত?") && renumber()}>১ থেকে নতুন রোল দিন</button></div></div>
      <Toast msg={msg} />
    </div>
  );
}
