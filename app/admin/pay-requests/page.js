"use client";
import { useEffect, useState, useCallback } from "react";
import { api, Pager, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { confirmBox, promptBox } from "@/components/Dialog";

const badge = { pending: "bg-amber-100 text-amber-800", approved: "bg-brand-light text-brand", rejected: "bg-red-100 text-red-700" };

// শিক্ষার্থীদের অনলাইন পেমেন্ট যাচাই: Approve করলেই পেমেন্ট "Paid" হয়, হিসাব ও অডিট লগ আপডেট হয়
export default function PayRequests() {
  const { x, n, money, date } = useLang();
  const [status, setStatus] = useState("pending"); const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const [d, setD] = useState(null); const [page, setPage] = useState(1); const [err, setErr] = useState(""); const [toast, setToast] = useState(""); const [busy, setBusy] = useState("");
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const load = useCallback(async () => { const r = await api("GET", `/api/pay-requests?page=${page}&limit=20&status=${status}&q=${encodeURIComponent(dq)}`); r.ok ? (setD(r.d), setErr("")) : setErr(r.d.error || x("লোড করা যায়নি")); }, [page, status, dq]);
  useEffect(() => { load(); }, [load]);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  async function decide(r, action) {
    let note = "";
    if (action === "approve") { if (!(await confirmBox(x("{0} টাকা ({1}) — ট্রানজেকশন {2} যাচাই করেছেন? Approve করলে পেমেন্ট সম্পন্ন হিসেবে গণ্য হবে।", money(r.amount), r.methodLabel, r.trxId))) ) return; }
    else { note = await promptBox(x("প্রত্যাখ্যানের কারণ (শিক্ষার্থী দেখতে পাবে):"), { danger: true }); if (!note) return; }
    setBusy(r._id); const res = await api("POST", `/api/pay-requests/${r._id}/decide`, { action, note }); setBusy("");
    if (!res.ok) flash("⚠ " + (res.d.error || x("সমস্যা হয়েছে"))); else flash(action === "approve" ? x("✅ Approve হয়েছে — {0}", res.d.receiptNo) : x("✅ প্রত্যাখ্যান করা হয়েছে"));
    load();
  }
  if (!d && !err) return <Loader compact label={x("লোড হচ্ছে...")} />;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("অনলাইন পেমেন্ট যাচাই")}{d?.pending > 0 && status !== "pending" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-800">{x("অপেক্ষমাণ {0}", d.pending)}</span>}</h1>
        <input className="input !w-56" placeholder={x("ট্রানজেকশন আইডি/নম্বর")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="mb-4 flex gap-2 overflow-x-auto border-b">{[["pending", "অপেক্ষমাণ"], ["approved", "অনুমোদিত"], ["rejected", "প্রত্যাখ্যাত"], ["", "সব"]].map(([k, l]) => <button key={k} onClick={() => { setStatus(k); setPage(1); }} className={`whitespace-nowrap px-4 py-2 font-semibold ${status === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{x(l)}</button>)}</div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[900px]"><thead><tr>{["শিক্ষার্থী", "ফি", "টাকা", "মাধ্যম", "প্রেরক → প্রাপক", "ট্রানজেকশন আইডি", "তারিখ", "অবস্থা", ""].map((h, i) => <th key={i} className="th">{x(h)}</th>)}</tr></thead>
        <tbody>{d?.items.map((r) => <tr key={r._id}>
          <td className="td">{r.student?.name}<span className="block text-xs text-slate-500">{r.student?.studentId} · {x(r.student?.class)}{r.student?.section ? `(${r.student.section})` : ""}-{n(r.student?.roll)}</span></td>
          <td className="td">{r.invoice?.title && x(r.invoice.title)}<span className="block text-xs text-slate-500">{r.invoice?.invoiceNo}</span></td>
          <td className="td font-bold">{money(r.amount)}</td><td className="td">{r.methodLabel}</td>
          <td className="td text-xs">{r.senderNumber}<br />→ {r.receiverNumber}</td><td className="td font-mono text-xs">{r.trxId}</td>
          <td className="td whitespace-nowrap">{date(r.paidDate)}<span className="block text-xs text-slate-500">{date(r.createdAt?.slice(0, 10))}</span></td>
          <td className="td"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${badge[r.status]}`}>{x({ pending: "অপেক্ষমাণ", approved: "অনুমোদিত", rejected: "প্রত্যাখ্যাত" }[r.status])}</span>{r.decidedByName && <span className="block text-xs text-slate-500">{r.decidedByName}</span>}{r.decisionNote && <span className="block max-w-[10rem] text-xs text-red-600">{r.decisionNote}</span>}</td>
          <td className="td whitespace-nowrap text-right">{r.status === "pending" ? <><button disabled={busy === r._id} className="mr-3 font-semibold text-brand" onClick={() => decide(r, "approve")}>{x("Approve")}</button><button disabled={busy === r._id} className="font-semibold text-red-600" onClick={() => decide(r, "reject")}>{x("Reject")}</button></> : r.payment ? <a className="font-semibold text-brand" target="_blank" href={`/admin/receipt/${r.payment._id}`}>{x("ইনভয়েস")}</a> : null}</td></tr>)}
          {d && d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={9}>{x("কোনো অনুরোধ নেই")}</td></tr>}</tbody></table></div>
      {d && <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />}
      <Toast msg={toast} />
    </div>
  );
}
