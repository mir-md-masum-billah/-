"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "./CrudPage";
import Icon from "./Icon";
import { useLang } from "./LangProvider";
import { todayDhaka } from "@/lib/dates";

const kindColor = { bkash: "#E2136E", nagad: "#F6921E", rocket: "#8C3494", bank: "#0A4435", other: "#475569" };
const stBadge = { pending: "bg-amber-100 text-amber-800", approved: "bg-brand-light text-brand", rejected: "bg-red-100 text-red-700" };

// শিক্ষার্থীর পেমেন্ট: ফি বাছাই → মাধ্যম বাছাই → নম্বর ও নির্দেশনা → তথ্য ফর্ম → অ্যাডমিন/অনুমোদিত ব্যক্তির Approve
export default function StudentPay({ student, invoices, preInvoice, onDone }) {
  const { x, money, date } = useLang();
  const [methods, setMethods] = useState(null); const [reqs, setReqs] = useState([]);
  const [step, setStep] = useState(1); const [inv, setInv] = useState(null); const [m, setM] = useState(null);
  const [f, setF] = useState({ amount: "", paidDate: todayDhaka(), senderNumber: "", receiverNumber: "", trxId: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [okMsg, setOkMsg] = useState("");
  const loadReqs = useCallback(() => api("GET", "/api/pay-requests?limit=30").then((r) => r.ok && setReqs(r.d.items)), []);
  useEffect(() => { api("GET", "/api/payment-methods").then((r) => setMethods(r.ok ? r.d.items : [])); loadReqs(); }, []);
  const pendingBy = {}; reqs.filter((r) => r.status === "pending").forEach((r) => { pendingBy[r.invoice?._id] = (pendingBy[r.invoice?._id] || 0) + r.amount; });
  const payable = invoices.map((i) => ({ ...i, free: Math.round((i.due - (pendingBy[i._id] || 0)) * 100) / 100 })).filter((i) => i.due > 0);
  useEffect(() => { if (preInvoice) { const i = payable.find((p) => p._id === preInvoice); if (i && i.free > 0) { setInv(i); setF((o) => ({ ...o, amount: i.free })); setStep(2); setOkMsg(""); } } }, [preInvoice, invoices.length]); // eslint-disable-line
  const reset = () => { setStep(1); setInv(null); setM(null); setErr(""); setF({ amount: "", paidDate: todayDhaka(), senderNumber: "", receiverNumber: "", trxId: "" }); };
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await api("POST", "/api/pay-requests", { invoice: inv._id, methodId: m.id, amount: Number(f.amount), paidDate: f.paidDate, senderNumber: f.senderNumber, receiverNumber: f.receiverNumber, trxId: f.trxId });
    setBusy(false); if (!r.ok) return setErr(r.d.error || x("সমস্যা হয়েছে"));
    reset(); setOkMsg(x("✅ পেমেন্টের তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করে Approve করলে এটি \"Paid\" হবে।")); loadReqs(); onDone?.();
  }
  const copy = (t) => navigator.clipboard?.writeText(t).catch(() => {});
  if (!methods) return null;
  return (
    <div className="space-y-4">
      <div className="card"><h2 className="font-display text-xl text-brand-dark">{x("ফি পরিশোধ করুন")}</h2>
        {okMsg && <p role="status" className="mt-3 rounded-lg bg-brand-light p-3 text-sm text-brand">{okMsg}</p>}
        {payable.length === 0 ? <p className="mt-3 text-slate-500">{x("এখন পরিশোধের মতো কোনো বকেয়া ফি নেই।")}</p> : methods.length === 0 ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-amber-800">{x("অনলাইন পেমেন্ট মাধ্যম এখনও চালু হয়নি — অনুগ্রহ করে অফিসে ক্যাশ জমা দিন।")}</p> : <>
          <ol className="mt-3 flex gap-2 text-xs font-semibold">{[x("ফি"), x("মাধ্যম"), x("পেমেন্ট ও তথ্য")].map((l, i) => <li key={i} className={`rounded-full px-3 py-1 ${step === i + 1 ? "bg-brand text-white" : step > i + 1 ? "bg-brand-light text-brand" : "bg-slate-100 text-slate-500"}`}>{i + 1}. {l}</li>)}</ol>
          {step === 1 && <div className="mt-4 space-y-2"><p className="text-sm font-semibold">{x("কোন ফি পরিশোধ করবেন?")}</p>{payable.map((i) => <button key={i._id} disabled={i.free <= 0} onClick={() => { setInv(i); setF({ ...f, amount: i.free }); setStep(2); setOkMsg(""); }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-gold disabled:opacity-50"><span><span className="font-semibold">{x(i.title)}</span><span className="block text-xs text-slate-500">{i.invoiceNo}{pendingBy[i._id] ? ` · ${x("যাচাই অপেক্ষায় {0}", money(pendingBy[i._id]))}` : ""}</span></span><span className="font-bold text-red-600">{money(i.free > 0 ? i.free : i.due)}</span></button>)}</div>}
          {step === 2 && <div className="mt-4"><p className="mb-2 text-sm font-semibold">{x("পেমেন্ট মাধ্যম বাছাই করুন")} — <span className="text-slate-600">{x(inv.title)} · {money(inv.free)}</span></p>
            <div className="grid gap-3 sm:grid-cols-2">{methods.map((mm) => <button key={mm.id} onClick={() => { setM(mm); setF({ ...f, receiverNumber: mm.accountNumber }); setStep(3); }} className="rounded-xl border-2 border-slate-200 p-3 text-left transition hover:border-gold"><span className="inline-block rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: kindColor[mm.kind] }}>{mm.label}</span><span className="mt-1 block font-mono text-lg">{mm.accountNumber}</span><span className="text-xs text-slate-500">{mm.accountType}</span></button>)}</div>
            <button className="mt-3 text-sm text-slate-600 underline" onClick={() => setStep(1)}>← {x("ফি বদলান")}</button></div>}
          {step === 3 && <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="rounded-xl border-2 border-gold/60 bg-gold-light/40 p-4"><p className="text-sm font-semibold text-brand-dark">{x("এই নম্বরে {0} টাকা পাঠান", money(f.amount || inv.free))}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2"><span className="rounded px-2 py-0.5 text-xs font-bold text-white" style={{ background: kindColor[m.kind] }}>{m.label}</span><span className="font-mono text-xl font-bold">{m.accountNumber}</span><button type="button" onClick={() => copy(m.accountNumber)} className="text-sm text-brand underline">{x("কপি")}</button></p>
              <p className="text-xs text-slate-600">{[m.accountType, m.accountName].filter(Boolean).join(" · ")}</p>{m.instructions && <p className="mt-2 whitespace-pre-line text-sm">{m.instructions}</p>}
              <p className="mt-2 text-xs text-slate-600">{x("টাকা পাঠানোর পর নিচের ফর্মটি পূরণ করুন। পেমেন্ট যাচাইয়ের আগে \"Paid\" দেখাবে না।")}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">{x("শিক্ষার্থীর নাম ও আইডি")}</label><input readOnly className="input bg-slate-50" value={`${student.name} (${student.studentId})`} /></div>
              <div><label className="label">{x("পেমেন্টের ধরন")}</label><input readOnly className="input bg-slate-50" value={x(inv.title)} /></div>
              <div><label className="label">{x("পেমেন্টের পরিমাণ (৳)")}</label><input required type="number" step="0.01" min="0.01" max={inv.free} className="input" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
              <div><label className="label">{x("পেমেন্টের তারিখ")}</label><input required type="date" max={todayDhaka()} className="input" value={f.paidDate} onChange={(e) => setF({ ...f, paidDate: e.target.value })} /></div>
              <div><label className="label">{x("যে নম্বর থেকে টাকা পাঠিয়েছেন")}</label><input required inputMode="tel" className="input" value={f.senderNumber} onChange={(e) => setF({ ...f, senderNumber: e.target.value })} /></div>
              <div><label className="label">{x("যে নম্বরে টাকা পাঠিয়েছেন")}</label><input required inputMode="tel" className="input" value={f.receiverNumber} onChange={(e) => setF({ ...f, receiverNumber: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">{x("ট্রানজেকশন আইডি (Transaction ID)")}</label><input required className="input font-mono uppercase" value={f.trxId} onChange={(e) => setF({ ...f, trxId: e.target.value })} /></div></div>
            {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
            <div className="flex gap-3"><button type="button" className="btn-ghost" onClick={() => setStep(2)}>←</button><button className="btn-primary flex-1" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : x("তথ্য জমা দিন")}</button></div></form>}
        </>}
      </div>
      {reqs.length > 0 && <div className="card overflow-x-auto !p-0"><h2 className="border-b border-gold/40 px-4 pb-2 pt-4 font-display text-xl text-brand-dark">{x("আমার পেমেন্ট অনুরোধ")}</h2>
        <table className="w-full min-w-[520px]"><thead><tr>{["তারিখ", "খাত", "টাকা", "মাধ্যম / ট্রানজেকশন", "অবস্থা"].map((h) => <th key={h} className="th">{x(h)}</th>)}</tr></thead>
          <tbody>{reqs.map((r) => <tr key={r._id}><td className="td whitespace-nowrap">{date(r.paidDate)}</td><td className="td">{r.invoice?.title && x(r.invoice.title)}</td><td className="td font-semibold">{money(r.amount)}</td><td className="td">{r.methodLabel}<span className="block font-mono text-xs text-slate-500">{r.trxId}</span></td>
            <td className="td"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${stBadge[r.status]}`}>{x({ pending: "যাচাই চলছে", approved: "Paid ✓", rejected: "প্রত্যাখ্যাত" }[r.status])}</span>{r.decisionNote && r.status === "rejected" && <span className="block text-xs text-red-600">{r.decisionNote}</span>}{r.payment && <a className="mt-0.5 block text-xs font-semibold text-brand underline" target="_blank" href={`/student/receipt/${r.payment._id}`}>{x("ইনভয়েস")}</a>}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
