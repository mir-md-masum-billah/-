"use client";
import { useEffect, useState, useCallback } from "react";
import useMe from "@/hooks/useMe";
import { useLang } from "@/components/LangProvider";
import Modal from "@/components/Modal";
import { api, Pager, Toast } from "@/components/CrudPage";
import { todayDhaka } from "@/lib/dates";
import Loader from "@/components/Loader";
import { confirmBox } from "@/components/Dialog";

const SL = { pending: ["অপেক্ষমাণ", "bg-amber-100 text-amber-800"], approved: ["অনুমোদিত", "bg-brand-light text-brand"], rejected: ["প্রত্যাখ্যাত", "bg-red-100 text-red-700"], cancelled: ["বাতিলকৃত", "bg-slate-100 text-slate-600"] };
export default function Leave() {
  const { x, n, date } = useLang();
  const me = useMe(); const [d, setD] = useState({ items: [], total: 0, pages: 1 }); const [page, setPage] = useState(1); const [status, setStatus] = useState(""); const [kind, setKind] = useState(""); const [err, setErr] = useState("");
  const [m, setM] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false); const [toast, setToast] = useState("");
  const flash = (t) => { setToast(t); setTimeout(() => setToast(""), 3000); };
  const load = useCallback(async () => { const r = await api("GET", `/api/leaves?page=${page}&limit=20${status ? "&status=" + status : ""}${kind ? "&kind=" + kind : ""}`); if (r.ok) setD(r.d); else setErr(r.d.error || "লোড করা যায়নি"); }, [page, status, kind]);
  useEffect(() => { load(); }, [load]); useEffect(() => setPage(1), [status, kind]);
  async function send(e, method, url, body, msg) { e.preventDefault?.(); setBusy(true); setMErr(""); const r = await api(method, url, body); setBusy(false); if (!r.ok) { setMErr(r.d.error || x("সমস্যা হয়েছে")); return; } setM(null); flash(msg(r.d)); load(); }
  if (!me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const approver = me.perms.includes("leave.approve");
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("ছুটি")}</h1>
        {approver && <select className="input !w-auto" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">{x("স্টাফ+শিক্ষার্থী")}</option><option value="staff">{x("স্টাফ")}</option><option value="student">{x("শিক্ষার্থী")}</option></select>}
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{x("সব অবস্থা")}</option>{Object.entries(SL).map(([k, v]) => <option key={k} value={k}>{x(v[0])}</option>)}</select>
        <button className="btn-primary" onClick={() => { setMErr(""); setForm({ from: todayDhaka(), to: todayDhaka() }); setM({ type: "apply" }); }}>{x("+ ছুটির আবেদন")}</button></div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{x(err)}</p>}
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[640px]"><thead><tr>{["আবেদনকারী", "তারিখ", "কারণ", "অবস্থা", ""].map((h) => <th key={h} className="th">{x(h)}</th>)}</tr></thead>
        <tbody>{d.items.map((l) => <tr key={l._id}><td className="td">{l.kind === "student" ? `${l.student?.name} (${x(l.student?.class)}-${n(l.student?.roll)})` : l.user?.name}<span className="block text-xs text-slate-500">{l.kind === "student" ? x("শিক্ষার্থী") : x("স্টাফ")}</span></td><td className="td whitespace-nowrap">{date(l.from)}{l.to !== l.from && ` → ${date(l.to)}`}</td><td className="td">{l.reason}</td>
          <td className="td"><span className={`rounded px-2 py-0.5 text-xs ${SL[l.status][1]}`}>{x(SL[l.status][0])}</span>{l.decisionNote && <span className="block text-xs text-slate-500">{l.decidedByName}: {l.decisionNote}</span>}</td>
          <td className="td whitespace-nowrap text-right">{l.status === "pending" && <>{approver && !(l.kind === "staff" && String(l.user?._id) === me.id) && <><button className="mr-3 font-semibold text-brand" onClick={async (e) => (await confirmBox(x("অনুমোদন করবেন?"))) && send(e, "POST", `/api/leaves/${l._id}/decide`, { approve: true }, (r) => x("✅ অনুমোদিত") + (r.applied ? x(" — {0} দিনের হাজিরায় ছুটি বসেছে", r.applied) : ""))}>{x("অনুমোদন")}</button><button className="mr-3 font-semibold text-red-600" onClick={() => { setMErr(""); setForm({}); setM({ type: "reject", l }); }}>{x("প্রত্যাখ্যান")}</button></>}
            {((l.kind === "staff" && String(l.user?._id) === me.id) || (l.kind === "student" && false)) && <button className="font-semibold text-slate-600" onClick={async (e) => (await confirmBox(x("আবেদন বাতিল করবেন?"), { danger: true })) && send(e, "DELETE", `/api/leaves/${l._id}`, null, () => x("✅ বাতিল"))}>{x("বাতিল")}</button>}</>}</td></tr>)}
          {d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={5}>{x("কোনো আবেদন নেই")}</td></tr>}</tbody></table></div>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />
      {m?.type === "apply" && <Modal title={x("ছুটির আবেদন")} onClose={() => setM(null)}><form className="space-y-3" onSubmit={(e) => send(e, "POST", "/api/leaves", form, () => x("✅ আবেদন জমা হয়েছে"))}>
        <div><label className="label">{x("শুরু")}</label><input type="date" required className="input" value={form.from} min={todayDhaka()} onChange={(e) => setForm({ ...form, from: e.target.value, to: form.to < e.target.value ? e.target.value : form.to })} /></div>
        <div><label className="label">{x("শেষ")}</label><input type="date" required className="input" value={form.to} min={form.from} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
        <div><label className="label">{x("কারণ")}</label><textarea required minLength={3} rows={3} className="input" onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{x("আবেদন করুন")}</button></form></Modal>}
      {m?.type === "reject" && <Modal title={x("প্রত্যাখ্যান")} onClose={() => setM(null)}><form className="space-y-3" onSubmit={(e) => send(e, "POST", `/api/leaves/${m.l._id}/decide`, { approve: false, note: form.note }, () => x("✅ প্রত্যাখ্যান করা হয়েছে"))}>
        <div><label className="label">{x("কারণ (আবশ্যক)")}</label><input required minLength={3} className="input" onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-danger w-full" disabled={busy}>{x("প্রত্যাখ্যান করুন")}</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
