"use client";
import { useEffect, useState } from "react";
import useSettings from "@/hooks/useSettings";
import { api, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";

export default function Promotion() {
  const st = useSettings(); const { x, n } = useLang();
  const [f, setF] = useState({ fromClass: "", fromSection: "", toClass: "", toSection: "", session: "", graduate: false });
  const [list, setList] = useState([]); const [sel, setSel] = useState({}); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [order, setOrder] = useState("name");
  useEffect(() => { if (st && !f.fromClass) setF((x) => ({ ...x, fromClass: st.classes[0]?.name || "", session: st.currentSession || "" })); }, [st]); // eslint-disable-line
  useEffect(() => {
    if (!f.fromClass) return;
    api("GET", `/api/students?class=${encodeURIComponent(f.fromClass)}${f.fromSection ? "&section=" + encodeURIComponent(f.fromSection) : ""}&active=true&limit=500`).then((r) => { if (r.ok) { setList(r.d.items); setSel(Object.fromEntries(r.d.items.map((s) => [s._id, true]))); } });
  }, [f.fromClass, f.fromSection, msg]);
  if (!st) return <p>{x("লোড হচ্ছে...")}</p>;
  const chosen = list.filter((s) => sel[s._id]); const secs = (n) => st.classes.find((c) => c.name === n)?.sections || [];
  async function run() {
    setErr(""); setMsg("");
    if (!chosen.length) return setErr(x("কমপক্ষে একজন বাছাই করুন"));
    if (!confirm(f.graduate ? x("{0} জনকে \"পাস করে বের\" করবেন? লগইন বন্ধ হবে।", chosen.length) : x("{0} জনকে {1} থেকে {2} এ প্রমোশন দেবেন?", chosen.length, x(f.fromClass), x(f.toClass)))) return;
    setBusy(true); const r = await api("POST", "/api/students/promote", { ...f, studentIds: chosen.map((s) => s._id) }); setBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে")); setMsg(f.graduate ? x("✅ {0} জনের পাস সম্পন্ন", r.d.moved) : x("✅ {0} জনের প্রমোশন সম্পন্ন", r.d.moved));
  }
  async function renumber() {
    setErr(""); const r = await api("POST", "/api/students/rolls", { class: f.fromClass, section: f.fromSection, order });
    if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে")); setMsg(x("✅ রোল পুনর্বিন্যাস: {0} জনের রোল বদলেছে", r.d.changed));
  }
  const sel1 = (k, opts, ph) => <select className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value, ...(k === "fromClass" ? { fromSection: "" } : {}), ...(k === "toClass" ? { toSection: "" } : {}) })}><option value="">{x(ph)}</option>{opts.map((o) => <option key={o} value={o}>{x(o)}</option>)}</select>;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{x("প্রমোশন ও রোল")}</h1>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card space-y-4"><h2 className="font-bold">{x("শ্রেণি প্রমোশন")}</h2>
        <div className="grid gap-3 sm:grid-cols-4"><div><label className="label">{x("বর্তমান শ্রেণি")}</label>{sel1("fromClass", st.classes.map((c) => c.name), "—")}</div><div><label className="label">{x("শাখা")}</label>{sel1("fromSection", secs(f.fromClass), "সব")}</div>
          {!f.graduate && <><div><label className="label">{x("নতুন শ্রেণি")}</label>{sel1("toClass", st.classes.map((c) => c.name), "— বাছাই —")}</div><div><label className="label">{x("নতুন শাখা")}</label>{sel1("toSection", secs(f.toClass), "—")}</div><div><label className="label">{x("নতুন সেশন")}</label><input className="input" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value })} /></div></>}</div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.graduate} onChange={(e) => setF({ ...f, graduate: e.target.checked })} /> {x("শেষ শ্রেণি — পাস করে বের হচ্ছে (প্রমোশন নয়)")}</label>
        <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[420px]"><thead><tr><th className="th"><input type="checkbox" aria-label={x("সব")} checked={chosen.length === list.length && list.length > 0} onChange={(e) => setSel(Object.fromEntries(list.map((s) => [s._id, e.target.checked])))} /></th><th className="th">{x("রোল")}</th><th className="th">{x("নাম")}</th><th className="th">{x("শাখা")}</th></tr></thead>
          <tbody>{list.map((s) => <tr key={s._id}><td className="td"><input type="checkbox" checked={!!sel[s._id]} onChange={(e) => setSel({ ...sel, [s._id]: e.target.checked })} /></td><td className="td">{n(s.roll)}</td><td className="td">{s.name}</td><td className="td">{s.section || "—"}</td></tr>)}{!list.length && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>{x("কোনো সক্রিয় শিক্ষার্থী নেই")}</td></tr>}</tbody></table></div>
        <p className="text-sm text-slate-600">{x("টিক ওঠা {0} জন যাবে। যাদের টিক সরাবেন (অকৃতকার্য) তারা বর্তমান শ্রেণিতেই থাকবে। রোল নতুন শ্রেণির শেষ রোলের পর থেকে ক্রমানুসারে বসবে।", chosen.length)}</p>
        <button className="btn-primary" disabled={busy || (!f.graduate && !f.toClass)} onClick={run}>{busy ? x("অপেক্ষা করুন...") : f.graduate ? x("পাস সম্পন্ন করুন") : x("প্রমোশন দিন")}</button></div>
      <div className="card space-y-3"><h2 className="font-bold">{x("রোল পুনর্বিন্যাস")} ({x(f.fromClass)}{f.fromSection && ` — ${f.fromSection}`})</h2>
        <div className="flex flex-wrap items-center gap-3"><select className="input !w-auto" value={order} onChange={(e) => setOrder(e.target.value)}><option value="name">{x("নামের বর্ণানুক্রমে")}</option><option value="roll">{x("বর্তমান রোলের ক্রমে (ফাঁক ভরাট)")}</option></select><button className="btn-ghost" onClick={() => confirm(x("রোল বদলে যাবে। নিশ্চিত?")) && renumber()}>{x("১ থেকে নতুন রোল দিন")}</button></div></div>
      <Toast msg={msg} />
    </div>
  );
}
