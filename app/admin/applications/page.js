"use client";
import { useEffect, useState, useCallback } from "react";
import useSettings from "@/hooks/useSettings";
import Modal from "@/components/Modal";
import { api, Pager, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";

const SL = { pending: ["অপেক্ষমাণ", "bg-amber-100 text-amber-800"], approved: ["অনুমোদিত", "bg-brand-light text-brand"], rejected: ["প্রত্যাখ্যাত", "bg-red-100 text-red-700"] };
export default function Applications() {
  const st = useSettings(); const { x, n, date } = useLang();
  const [status, setStatus] = useState("pending"); const [page, setPage] = useState(1); const [d, setD] = useState({ items: [], total: 0, pages: 1 }); const [err, setErr] = useState("");
  const [m, setM] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false); const [creds, setCreds] = useState(null); const [toast, setToast] = useState("");
  const load = useCallback(async () => { const r = await api("GET", `/api/applications?status=${status}&page=${page}&limit=20`); if (r.ok) setD(r.d); else setErr(r.d.error || x("লোড করা যায়নি")); }, [status, page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [status]);
  async function decide(e) {
    e.preventDefault(); setBusy(true); setMErr("");
    const r = await api("POST", `/api/applications/${m.a._id}/decide`, { approve: m.approve, note: form.note, section: form.section, roll: form.roll || undefined, monthlyFee: form.monthlyFee }); setBusy(false);
    if (!r.ok) return setMErr(r.d.error || x("সমস্যা হয়েছে"));
    setM(null); load(); if (m.approve) setCreds(r.d); else { setToast(x("✅ প্রত্যাখ্যান করা হয়েছে")); setTimeout(() => setToast(""), 2500); }
  }
  if (!st) return <Loader compact label={x("লোড হচ্ছে...")} />;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("ভর্তির আবেদন")}</h1>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">{x("অপেক্ষমাণ")}</option><option value="approved">{x("অনুমোদিত")}</option><option value="rejected">{x("প্রত্যাখ্যাত")}</option><option value="">{x("সব")}</option></select></div>
      <p className="mb-3 text-sm text-slate-600">{x("আবেদন লিংক:")} <b>/admission</b> {x("(হোমপেজে \"ভর্তির আবেদন\" বাটন আছে)")}</p>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[640px]"><thead><tr>{["তারিখ", "শিক্ষার্থী", "শ্রেণি", "পিতা", "মোবাইল", "অবস্থা", ""].map((h) => <th key={h} className="th">{x(h)}</th>)}</tr></thead>
        <tbody>{d.items.map((a) => <tr key={a._id}><td className="td whitespace-nowrap">{date(new Date(a.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }))}</td><td className="td">{a.name}{a.previousSchool && <span className="block text-xs text-slate-500">{x("আগের স্কুল:")} {a.previousSchool}</span>}</td><td className="td">{x(a.class)}</td><td className="td">{a.fatherName}</td><td className="td">{a.phone}</td>
          <td className="td"><span className={`rounded px-2 py-0.5 text-xs ${SL[a.status][1]}`}>{x(SL[a.status][0])}</span>{a.decisionNote && <span className="block text-xs text-slate-500">{a.decisionNote}</span>}</td>
          <td className="td whitespace-nowrap text-right">{a.status === "pending" && <><button className="mr-3 font-semibold text-brand" onClick={() => { setMErr(""); setForm({ monthlyFee: "" }); setM({ a, approve: true }); }}>{x("অনুমোদন")}</button><button className="font-semibold text-red-600" onClick={() => { setMErr(""); setForm({}); setM({ a, approve: false }); }}>{x("প্রত্যাখ্যান")}</button></>}</td></tr>)}
          {d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>{x("কোনো আবেদন নেই")}</td></tr>}</tbody></table></div>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />
      {m && <Modal title={m.approve ? x("ভর্তি অনুমোদন — {0}", m.a.name) : x("আবেদন প্রত্যাখ্যান")} onClose={() => setM(null)}><form className="space-y-3" onSubmit={decide}>
        {m.approve ? <>
          <p className="text-sm text-slate-600">{x("শ্রেণি")} {x(m.a.class)} · {x("আইডি ও পাসওয়ার্ড স্বয়ংক্রিয় তৈরি হবে।")}</p>
          <div><label className="label">{x("শাখা")}</label><select className="input" onChange={(e) => setForm({ ...form, section: e.target.value })}><option value="">—</option>{(st.classes.find((c) => c.name === m.a.class)?.sections || []).map((o) => <option key={o}>{o}</option>)}</select></div>
          <div><label className="label">{x("রোল (ফাঁকা = স্বয়ংক্রিয়)")}</label><input type="number" min="1" className="input" onChange={(e) => setForm({ ...form, roll: e.target.value })} /></div>
          <div><label className="label">{x("মাসিক বেতন (৳)")}</label><input type="number" min="0" className="input" onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></div></>
          : <div><label className="label">{x("কারণ (আবশ্যক)")}</label><input required minLength={3} className="input" onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>}
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className={m.approve ? "btn-primary w-full" : "btn-danger w-full"} disabled={busy}>{busy ? x("অপেক্ষা করুন...") : m.approve ? x("ভর্তি করুন") : x("প্রত্যাখ্যান করুন")}</button></form></Modal>}
      {creds && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-5" role="alertdialog"><h2 className="mb-2 text-xl font-bold">{x("ভর্তি সম্পন্ন — {0}", creds.name)}</h2><p className="mb-3 text-sm text-slate-600">{x("লগইন তথ্য এখনই অভিভাবককে দিন — পাসওয়ার্ড আর দেখানো হবে না।")}</p><p className="rounded-lg bg-slate-100 p-3 text-lg">{x("আইডি:")} <b>{creds.studentId}</b><br />{x("পাসওয়ার্ড:")} <b>{creds.password}</b></p><button className="btn-primary mt-4 w-full" onClick={() => setCreds(null)}>{x("লিখে রেখেছি")}</button></div></div>}
      <Toast msg={toast} />
    </div>
  );
}
