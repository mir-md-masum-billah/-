"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { school, months, money, bn, methodLabel } from "@/lib/school";

const label = { present: "উপস্থিত", absent: "অনুপস্থিত", late: "দেরি", leave: "ছুটি", holiday: "হলিডে" };
const tabs = [["home", "প্রোফাইল"], ["att", "হাজিরা"], ["fee", "বেতন"], ["res", "ফলাফল"], ["lv", "ছুটি"], ["not", "নোটিশ"]];

export default function StudentPortal() {
  const [leaves, setLeaves] = useState(null); const [lf, setLf] = useState({}); const [lErr, setLErr] = useState(""); const [lBusy, setLBusy] = useState(false); const [d, setD] = useState(null); const [err, setErr] = useState(""); const [tab, setTab] = useState("home");
  const load = () => { setErr(""); fetch("/api/student/me").then(async (r) => { if (r.status === 401) { location.href = "/login"; return; } const j = await r.json(); r.ok ? setD(j) : setErr(j.error || "তথ্য আনা যায়নি"); }).catch(() => setErr("নেটওয়ার্ক সমস্যা — ইন্টারনেট যাচাই করুন")); };
  useEffect(load, []);
  const loadLeaves = () => fetch("/api/leaves?limit=50").then((r) => r.json()).then((j) => setLeaves(j.items || [])).catch(() => setLeaves([]));
  useEffect(() => { if (tab === "lv") loadLeaves(); }, [tab]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  async function applyLeave(e) { e.preventDefault(); setLBusy(true); setLErr(""); const r = await fetch("/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: lf.from || today, to: lf.to || lf.from || today, reason: lf.reason }) }); const j = await r.json(); setLBusy(false); if (!r.ok) return setLErr(j.error || "সমস্যা হয়েছে"); setLf({}); e.target.reset(); loadLeaves(); }
  async function cancelLeave(id) { if (!confirm("আবেদন বাতিল করবেন?")) return; const r = await fetch("/api/leaves/" + id, { method: "DELETE" }); if (r.ok) loadLeaves(); }
  if (err) return <div className="p-6"><p role="alert" className="mb-3 rounded-lg bg-red-50 p-4 text-red-700">{err}</p><button className="btn-primary" onClick={load}>আবার চেষ্টা করুন</button></div>;
  if (!d) return <p className="p-6">লোড হচ্ছে...</p>;
  const { student: s, attendance: att, invoices, payments, results, notices } = d;

  // হারে ছুটি ও হলিডে ধরা হয় না; অচিহ্নিত দিনের রেকর্ডই নেই
  const counted = att.filter((a) => ["present", "late", "absent"].includes(a.status));
  const pres = counted.filter((a) => a.status !== "absent").length;
  const pct = counted.length ? Math.round((pres / counted.length) * 100) : null;
  const byMonth = {};
  att.forEach((a) => { const k = a.date.slice(0, 7); (byMonth[k] ||= { present: 0, absent: 0, late: 0, leave: 0, holiday: 0 })[a.status]++; });
  const totalDue = invoices.reduce((t, i) => t + Math.max(0, i.due), 0), totalPaid = invoices.reduce((t, i) => t + i.paid, 0);
  const groups = {}; results.forEach((r) => { (groups[`${r.exam} — ${r.year}`] ||= []).push(r); });

  return (
    <div className="min-h-screen">
      <header className="bg-brand text-white"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3"><Link href="/" className="font-bold">{school.name}</Link><LogoutButton className="btn bg-white/15 !py-1.5 text-white hover:bg-white/25" /></div></header>
      <nav className="sticky top-0 z-10 border-b bg-white" aria-label="পোর্টাল মেনু"><div className="mx-auto flex max-w-4xl overflow-x-auto px-2">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap px-4 py-3 font-semibold ${tab === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{l}</button>)}</div></nav>
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        {tab === "home" && <>
          <div className="card flex items-center gap-4">{s.photo ? <img src={s.photo} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-light text-3xl font-bold text-brand">{s.name[0]}</div>}
            <div><h1 className="text-2xl font-bold">{s.name}</h1><p className="text-slate-600">শ্রেণি: {s.class}{s.section ? ` (${s.section})` : ""} · রোল: {bn(s.roll)} · আইডি: {s.studentId}</p></div></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center"><p className="text-sm text-slate-600">হাজিরা</p><p className="text-2xl font-bold text-brand">{pct === null ? "—" : bn(pct) + "%"}</p></div>
            <div className="card text-center"><p className="text-sm text-slate-600">মোট জমা</p><p className="text-lg font-bold text-brand sm:text-xl">{money(totalPaid)}</p></div>
            <div className="card text-center"><p className="text-sm text-slate-600">বকেয়া</p><p className={`text-lg font-bold sm:text-xl ${totalDue > 0 ? "text-red-600" : "text-brand"}`}>{money(totalDue)}</p></div></div>
          <div className="card grid gap-2 text-sm sm:grid-cols-2">{[["পিতার নাম", s.fatherName], ["মাতার নাম", s.motherName], ["অভিভাবকের মোবাইল", s.guardianPhone || s.phone], ["জন্ম তারিখ", s.dob], ["ঠিকানা", s.address], ["মাসিক বেতন", money(s.monthlyFee)]].map(([k, v]) => <p key={k}><span className="text-slate-500">{k}: </span>{v || "—"}</p>)}</div>
        </>}

        {tab === "att" && <>
          <div className="card"><p className="text-slate-600">মোট উপস্থিতির হার (ছুটি/হলিডে বাদে)</p><p className="text-4xl font-bold text-brand">{pct === null ? "এখনো হাজিরা নেই" : bn(pct) + "%"}</p>{pct !== null && <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand" style={{ width: pct + "%" }} /></div>}</div>
          <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[480px]"><thead><tr>{["মাস", "উপস্থিত", "অনুপস্থিত", "দেরি", "ছুটি", "হার"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{Object.entries(byMonth).sort().reverse().map(([k, m]) => { const tot = m.present + m.late + m.absent; return <tr key={k}><td className="td">{months[Number(k.slice(5)) - 1]} {bn(k.slice(0, 4)).replace(/,/g, "")}</td><td className="td">{bn(m.present)}</td><td className="td">{bn(m.absent)}</td><td className="td">{bn(m.late)}</td><td className="td">{bn(m.leave)}</td><td className="td font-bold">{tot ? bn(Math.round(((m.present + m.late) / tot) * 100)) + "%" : "—"}</td></tr>; })}
              {att.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={6}>কোনো হাজিরা নেই</td></tr>}</tbody></table></div>
          <div className="card"><h2 className="mb-2 font-bold">সাম্প্রতিক হাজিরা</h2><div className="flex flex-wrap gap-2">{att.slice(0, 30).map((a) => <span key={a.date} className={`rounded-lg px-2.5 py-1 text-xs ${a.status === "absent" ? "bg-red-100 text-red-700" : a.status === "present" ? "bg-brand-light text-brand" : "bg-gold-light text-ink"}`}>{a.date.slice(5)} · {label[a.status]}</span>)}</div></div>
        </>}

        {tab === "fee" && <>
          <div className="grid grid-cols-2 gap-3"><div className="card"><p className="text-sm text-slate-600">মোট জমা</p><p className="text-2xl font-bold text-brand">{money(totalPaid)}</p></div><div className="card"><p className="text-sm text-slate-600">মোট বকেয়া</p><p className={`text-2xl font-bold ${totalDue > 0 ? "text-red-600" : "text-brand"}`}>{money(totalDue)}</p></div></div>
          <div className="card overflow-x-auto !p-0"><h2 className="px-4 pt-3 font-bold">ফি ও বকেয়া</h2><table className="w-full min-w-[480px]"><thead><tr>{["বিবরণ", "ধার্য", "জমা", "বকেয়া"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{invoices.map((i) => <tr key={i._id}><td className="td">{i.title}{i.period && ` — ${months[i.month - 1]} ${i.year}`}</td><td className="td">{money(i.obligation)}</td><td className="td">{money(i.paid)}</td><td className={`td font-bold ${i.due > 0 ? "text-red-600" : "text-brand"}`}>{i.due > 0 ? money(i.due) : "পরিশোধিত"}</td></tr>)}
              {invoices.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>কোনো ফি নেই</td></tr>}</tbody></table></div>
          <div className="card overflow-x-auto !p-0"><h2 className="px-4 pt-3 font-bold">পেমেন্টের ইতিহাস ও রসিদ</h2><table className="w-full min-w-[480px]"><thead><tr>{["তারিখ", "রসিদ", "বিবরণ", "পদ্ধতি", "টাকা"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{payments.map((p) => <tr key={p._id}><td className="td">{p.date}</td><td className="td"><a className="text-brand underline" href={`/student/receipt/${p._id}`} target="_blank">{p.receiptNo}</a></td><td className="td">{p.invoice?.title}{p.type === "refund" && " (ফেরত)"}</td><td className="td">{methodLabel[p.method]}</td><td className="td font-semibold">{p.type === "refund" ? "−" : ""}{money(p.amount)}</td></tr>)}
              {payments.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={5}>কোনো পেমেন্ট নেই</td></tr>}</tbody></table></div>
        </>}

        {tab === "res" && <>{Object.keys(groups).length === 0 && <p className="card text-slate-500">কোনো ফলাফল নেই।</p>}
          {Object.entries(groups).map(([name, rows]) => { const got = rows.reduce((t, r) => t + r.marks, 0), full = rows.reduce((t, r) => t + r.full, 0); return (
            <div key={name} className="card overflow-x-auto !p-0"><h2 className="px-4 pt-3 font-bold">{name}</h2><table className="w-full"><thead><tr><th className="th">বিষয়</th><th className="th">প্রাপ্ত</th><th className="th">পূর্ণমান</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r._id}><td className="td">{r.subject}</td><td className="td">{bn(r.marks)}</td><td className="td">{bn(r.full)}</td></tr>)}<tr className="bg-brand-light font-bold"><td className="td">মোট</td><td className="td">{bn(got)}</td><td className="td">{bn(full)} ({bn(Math.round((got / full) * 100))}%)</td></tr></tbody></table></div>); })}</>}

        {tab === "lv" && <>
          <form onSubmit={applyLeave} className="card grid gap-3 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">নতুন ছুটির আবেদন</h2>
            <div><label className="label">শুরু</label><input type="date" required min={today} defaultValue={today} className="input" onChange={(e) => setLf({ ...lf, from: e.target.value })} /></div>
            <div><label className="label">শেষ</label><input type="date" required min={lf.from || today} defaultValue={today} className="input" onChange={(e) => setLf({ ...lf, to: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">কারণ</label><textarea required minLength={3} rows={2} className="input" onChange={(e) => setLf({ ...lf, reason: e.target.value })} /></div>
            {lErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{lErr}</p>}<button className="btn-primary sm:col-span-2" disabled={lBusy}>{lBusy ? "অপেক্ষা করুন..." : "আবেদন করুন"}</button></form>
          <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[480px]"><thead><tr>{["তারিখ", "কারণ", "অবস্থা", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{(leaves || []).map((l) => <tr key={l._id}><td className="td whitespace-nowrap">{l.from}{l.to !== l.from && ` → ${l.to}`}</td><td className="td">{l.reason}</td><td className="td">{{ pending: "অপেক্ষমাণ", approved: "অনুমোদিত", rejected: "প্রত্যাখ্যাত", cancelled: "বাতিল" }[l.status]}{l.decisionNote && <span className="block text-xs text-slate-500">{l.decisionNote}</span>}</td><td className="td text-right">{l.status === "pending" && <button className="text-red-600" onClick={() => cancelLeave(l._id)}>বাতিল</button>}</td></tr>)}
              {leaves && leaves.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>কোনো আবেদন নেই</td></tr>}{!leaves && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>লোড হচ্ছে...</td></tr>}</tbody></table></div>
        </>}

        {tab === "not" && <>{notices.length === 0 && <p className="card text-slate-500">কোনো নোটিশ নেই।</p>}{notices.map((n) => <article key={n._id} className="card"><p className="text-xs text-slate-500">{n.date}</p><h2 className="font-bold">{n.title}</h2>{n.body && <p className="mt-1 whitespace-pre-line text-slate-700">{n.body}</p>}{n.fileUrl && <a href={n.fileUrl} target="_blank" className="mt-2 inline-block text-brand">সংযুক্ত ফাইল দেখুন</a>}</article>)}</>}
      </main>
    </div>
  );
}
