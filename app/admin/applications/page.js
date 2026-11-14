"use client";
import { useEffect, useState, useCallback } from "react";
import useSettings from "@/hooks/useSettings";
import Modal from "@/components/Modal";
import { api, Pager, Toast } from "@/components/CrudPage";

const SL = { pending: ["অপেক্ষমাণ", "bg-amber-100 text-amber-800"], approved: ["অনুমোদিত", "bg-brand-light text-brand"], rejected: ["প্রত্যাখ্যাত", "bg-red-100 text-red-700"] };
export default function Applications() {
  const st = useSettings();
  const [status, setStatus] = useState("pending"); const [page, setPage] = useState(1); const [d, setD] = useState({ items: [], total: 0, pages: 1 }); const [err, setErr] = useState("");
  const [m, setM] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false); const [creds, setCreds] = useState(null); const [toast, setToast] = useState("");
  const load = useCallback(async () => { const r = await api("GET", `/api/applications?status=${status}&page=${page}&limit=20`); if (r.ok) setD(r.d); else setErr(r.d.error || "লোড করা যায়নি"); }, [status, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [status]);
  async function decide(e) {
    e.preventDefault(); setBusy(true); setMErr("");
    const r = await api("POST", `/api/applications/${m.a._id}/decide`, { approve: m.approve, note: form.note, section: form.section, roll: form.roll || undefined, monthlyFee: form.monthlyFee }); setBusy(false);
    if (!r.ok) return setMErr(r.d.error || "সমস্যা হয়েছে");
    setM(null); load(); if (m.approve) setCreds(r.d); else { setToast("✅ প্রত্যাখ্যান করা হয়েছে"); setTimeout(() => setToast(""), 2500); }
  }
  if (!st) return <p>লোড হচ্ছে...</p>;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="mr-auto text-2xl font-bold">ভর্তির আবেদন</h1>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">অপেক্ষমাণ</option><option value="approved">অনুমোদিত</option><option value="rejected">প্রত্যাখ্যাত</option><option value="">সব</option></select></div>
      <p className="mb-3 text-sm text-slate-600">আবেদন লিংক: <b>/admission</b> (হোমপেজে "ভর্তির আবেদন" বাটন আছে)</p>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[640px]"><thead><tr>{["তারিখ", "শিক্ষার্থী", "শ্রেণি", "পিতা", "মোবাইল", "অবস্থা", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{d.items.map((a) => <tr key={a._id}><td className="td whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka" })}</td><td className="td">{a.name}{a.previousSchool && <span className="block text-xs text-slate-500">আগের স্কুল: {a.previousSchool}</span>}</td><td className="td">{a.class}</td><td className="td">{a.fatherName}</td><td className="td">{a.phone}</td>
          <td className="td"><span className={`rounded px-2 py-0.5 text-xs ${SL[a.status][1]}`}>{SL[a.status][0]}</span>{a.decisionNote && <span className="block text-xs text-slate-500">{a.decisionNote}</span>}</td>
          <td className="td whitespace-nowrap text-right">{a.status === "pending" && <><button className="mr-3 font-semibold text-brand" onClick={() => { setMErr(""); setForm({ monthlyFee: "" }); setM({ a, approve: true }); }}>অনুমোদন</button><button className="font-semibold text-red-600" onClick={() => { setMErr(""); setForm({}); setM({ a, approve: false }); }}>প্রত্যাখ্যান</button></>}</td></tr>)}
          {d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>কোনো আবেদন নেই</td></tr>}</tbody></table></div>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />
      {m && <Modal title={m.approve ? `ভর্তি অনুমোদন — ${m.a.name}` : "আবেদন প্রত্যাখ্যান"} onClose={() => setM(null)}><form className="space-y-3" onSubmit={decide}>
        {m.approve ? <>
          <p className="text-sm text-slate-600">শ্রেণি {m.a.class} · আইডি ও পাসওয়ার্ড স্বয়ংক্রিয় তৈরি হবে।</p>
          <div><label className="label">শাখা</label><select className="input" onChange={(e) => setForm({ ...form, section: e.target.value })}><option value="">—</option>{(st.classes.find((c) => c.name === m.a.class)?.sections || []).map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className="label">রোল (ফাঁকা = স্বয়ংক্রিয়)</label><input type="number" min="1" className="input" onChange={(e) => setForm({ ...form, roll: e.target.value })} /></div>
          <div><label className="label">মাসিক বেতন (৳)</label><input type="number" min="0" className="input" onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></div></>
          : <div><label className="label">কারণ (আবশ্যক)</label><input required minLength={3} className="input" onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>}
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className={m.approve ? "btn-primary w-full" : "btn-danger w-full"} disabled={busy}>{busy ? "অপেক্ষা করুন..." : m.approve ? "ভর্তি করুন" : "প্রত্যাখ্যান করুন"}</button></form></Modal>}
      {creds && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-5" role="alertdialog"><h2 className="mb-2 text-xl font-bold">✅ ভর্তি সম্পন্ন — {creds.name}</h2><p className="mb-3 text-sm text-slate-600">লগইন তথ্য এখনই অভিভাবককে দিন — পাসওয়ার্ড আর দেখানো হবে না।</p><p className="rounded-lg bg-slate-100 p-3 text-lg">আইডি: <b>{creds.studentId}</b><br />পাসওয়ার্ড: <b>{creds.password}</b></p><button className="btn-primary mt-4 w-full" onClick={() => setCreds(null)}>লিখে রেখেছি</button></div></div>}
      <Toast msg={toast} />
    </div>
  );
}
