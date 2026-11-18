"use client";
import { gradeOf, summarize } from "@/lib/grades";
import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import PasswordDialog from "@/components/PasswordDialog";
import Crest from "@/components/Crest";
import Icon from "@/components/Icon";
import Loader from "@/components/Loader";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";
import { useLang } from "@/components/LangProvider";
import { school } from "@/lib/school";
import { schoolEn, num, moneyL, dateL, monthName } from "@/lib/translations";
import { confirmBox } from "@/components/Dialog";
import { printUrl } from "@/lib/print";
import StudentPay from "@/components/StudentPay";
import StudentExams from "@/components/StudentExams";
import RoutineSheet from "@/components/RoutineSheet";

const Title = ({ children }) => <h2 className="border-b border-gold/40 px-4 pb-2 pt-4 font-display text-xl text-brand-dark">{children}</h2>;

export default function StudentPortal() {
  const { lang, t: all } = useLang(); const t = all.student;
  const bn = (n) => num(n, lang), money = (n) => moneyL(n, lang), bnDate = (s) => dateL(s, lang), mo = (i) => monthName(i, lang);
  const label = t.status, methodLabel = t.methods;
  const { x } = useLang(); const tabs = [...Object.entries(t.tabs), ["exam", x("পরীক্ষা")], ["rt", x("ক্লাস রুটিন")]];
  const [preInv, setPreInv] = useState(null); const [routine, setRoutine] = useState(null); const [rk, setRk] = useState(0);
  const schoolName = lang === "en" ? schoolEn.name : school.name;
  const [leaves, setLeaves] = useState(null); const [lf, setLf] = useState({}); const [lErr, setLErr] = useState(""); const [lBusy, setLBusy] = useState(false); const [d, setD] = useState(null); const [err, setErr] = useState(""); const [tab, setTab] = useState("home");
  const load = () => { setErr(""); fetch("/api/student/me").then(async (r) => { if (r.status === 401) { location.href = "/login"; return; } const j = await r.json(); r.ok ? setD(j) : setErr(j.error || t.errLoad); }).catch(() => setErr(t.errNet)); };
  useEffect(load, []);
  const loadLeaves = () => fetch("/api/leaves?limit=50").then((r) => r.json()).then((j) => setLeaves(j.items || [])).catch(() => setLeaves([]));
  useEffect(() => { if (tab === "lv") loadLeaves(); if (tab === "rt" && !routine) fetch("/api/student/routine").then((r) => r.json()).then(setRoutine).catch(() => setRoutine({ items: [] })); }, [tab]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  async function applyLeave(e) { e.preventDefault(); setLBusy(true); setLErr(""); const r = await fetch("/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: lf.from || today, to: lf.to || lf.from || today, reason: lf.reason }) }); const j = await r.json(); setLBusy(false); if (!r.ok) return setLErr(j.error || t.errGeneric); setLf({}); e.target.reset(); loadLeaves(); }
  async function cancelLeave(id) { if (!(await confirmBox(t.confirmCancel, { danger: true }))) return; const r = await fetch("/api/leaves/" + id, { method: "DELETE" }); if (r.ok) loadLeaves(); }
  if (err) return <div className="p-6"><p role="alert" className="mb-3 rounded-lg bg-red-50 p-4 text-red-700">{err}</p><button className="btn-primary" onClick={load}>{t.retry}</button></div>;
  if (!d) return <Loader full name={schoolName} label={t.loading} />;
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
    <div className="min-h-screen bg-pearl print:bg-white">
      <header className="lattice hero-glow text-white print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 font-display text-lg"><Crest className="h-8 w-auto text-gold-soft" />{schoolName}</Link>
          <span className="flex items-center gap-2"><LanguageSwitch /><ThemeToggle /><LogoutButton className="btn border border-white/25 !px-3 !py-1.5 text-sm text-white hover:border-gold-soft hover:bg-white/10" /></span>
        </div>
      </header>
      <nav className="sticky top-0 z-10 border-b border-gold/30 bg-white/95 backdrop-blur print:hidden" aria-label={t.portalMenu}><div className="mx-auto flex max-w-4xl overflow-x-auto px-2">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined} className={`whitespace-nowrap border-b-[3px] px-4 py-3.5 font-semibold transition ${tab === k ? "border-gold text-brand-dark" : "border-transparent text-slate-500 hover:text-brand"}`}>{l}</button>)}</div></nav>
      <main className="mx-auto max-w-4xl space-y-5 p-4 sm:py-8 print:max-w-none print:space-y-0 print:p-0">
        {tab === "home" && <>
          <div className="flex flex-wrap gap-2 print:hidden"><button className="btn-ghost !py-2" onClick={() => printUrl("/student/print")}>{x("আমার প্রোফাইল প্রিন্ট")}</button><button className="btn-ghost !py-2" onClick={() => printUrl("/student/print?mode=pay")}>{x("পেমেন্ট ইতিহাস প্রিন্ট")}</button><PasswordDialog className="btn-ghost !py-2" /></div>
          <div className="lattice flex items-center gap-5 overflow-hidden rounded-2xl bg-night p-5 text-white shadow-gilt sm:gap-7 sm:p-7">
            <div className="shrink-0 rounded-t-full border border-gold-soft/70 p-1">
              {s.photo ? <img src={s.photo} alt="" className="h-28 w-24 rounded-t-full object-cover sm:h-32 sm:w-28" /> : <div className="grid h-28 w-24 place-items-center rounded-t-full bg-brand font-display text-4xl text-gold-soft sm:h-32 sm:w-28">{s.name[0]}</div>}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl leading-snug text-white sm:text-4xl">{s.name}</h1>
              <span className="gold-rule mt-3" />
              <p className="mt-3 text-white/80">{t.cls}: {s.class}{s.section ? ` (${s.section})` : ""} · {t.roll}: {bn(s.roll)}</p>
              <p className="text-sm text-gold-soft">{t.id}: {s.studentId}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center"><p className="text-sm text-slate-600">{t.attendance}</p><p className="font-display text-2xl text-brand-dark sm:text-3xl">{pct === null ? "—" : bn(pct) + "%"}</p></div>
            <div className="card text-center"><p className="text-sm text-slate-600">{t.paid}</p><p className="font-display text-xl text-brand-dark sm:text-2xl">{money(totalPaid)}</p></div>
            <div className="card text-center"><p className="text-sm text-slate-600">{t.due}</p><p className={`font-display text-xl sm:text-2xl ${totalDue > 0 ? "text-red-600" : "text-brand-dark"}`}>{money(totalDue)}</p></div></div>
          <div className="card grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">{[[t.father, s.fatherName], [t.mother, s.motherName], [t.guardianPhone, s.guardianPhone || s.phone], [t.dob, s.dob ? bnDate(s.dob) : s.dob], [t.address, s.address], [t.monthlyFee, money(s.monthlyFee)]].map(([k, v]) => <p key={k} className="border-b border-slate-100 pb-2"><span className="block text-xs text-slate-500">{k}</span>{v || "—"}</p>)}</div>
        </>}

        {tab === "att" && <>
          <div className="card"><p className="text-slate-600">{t.rate}</p><p className="font-display text-5xl text-brand-dark">{pct === null ? <span className="text-2xl text-slate-500">{t.noAtt}</span> : bn(pct) + "%"}</p>{pct !== null && <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-light"><div className="h-full rounded-full bg-gradient-to-r from-brand to-gold" style={{ width: pct + "%" }} /></div>}</div>
          <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[480px]"><thead><tr>{t.cols.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{Object.entries(byMonth).sort().reverse().map(([k, m]) => { const tot = m.present + m.late + m.absent; return <tr key={k}><td className="td">{mo(Number(k.slice(5)) - 1)} {bn(k.slice(0, 4)).replace(/,/g, "")}</td><td className="td">{bn(m.present)}</td><td className="td">{bn(m.absent)}</td><td className="td">{bn(m.late)}</td><td className="td">{bn(m.leave)}</td><td className="td font-bold">{tot ? bn(Math.round(((m.present + m.late) / tot) * 100)) + "%" : "—"}</td></tr>; })}
              {att.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={6}>{t.noAttRows}</td></tr>}</tbody></table></div>
          <div className="card"><h2 className="mb-3 font-display text-xl text-brand-dark">{t.recent}</h2><div className="flex flex-wrap gap-2">{att.slice(0, 30).map((a) => <span key={a.date} className={`rounded-md px-2.5 py-1 text-xs ${a.status === "absent" ? "bg-red-100 text-red-700" : a.status === "present" ? "bg-brand-light text-brand" : "bg-gold-light text-ink"}`}>{a.date.slice(5)} · {label[a.status]}</span>)}</div></div>
        </>}

        {tab === "fee" && <>
          <div className="grid grid-cols-2 gap-3"><div className="card"><p className="text-sm text-slate-600">{t.paid}</p><p className="font-display text-3xl text-brand-dark">{money(totalPaid)}</p></div><div className="card"><p className="text-sm text-slate-600">{t.totalDue}</p><p className={`font-display text-3xl ${totalDue > 0 ? "text-red-600" : "text-brand-dark"}`}>{money(totalDue)}</p></div></div>
          <StudentPay student={s} invoices={invoices} preInvoice={preInv} onDone={() => { load(); setRk((v) => v + 1); }} />
          <div className="card overflow-x-auto !p-0"><Title>{t.feeTitle}</Title><table className="w-full min-w-[480px]"><thead><tr>{t.feeCols.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{invoices.map((i) => <tr key={i._id}><td className="td">{i.title}{i.period && ` — ${mo(i.month - 1)} ${i.year}`}</td><td className="td">{money(i.obligation)}</td><td className="td">{money(i.paid)}</td><td className={`td font-bold ${i.due > 0 ? "text-red-600" : "text-brand"}`}>{i.due > 0 ? money(i.due) : t.settled}</td></tr>)}
              {invoices.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>{t.noFees}</td></tr>}</tbody></table></div>
          <div className="card overflow-x-auto !p-0"><Title>{t.payTitle}</Title><table className="w-full min-w-[480px]"><thead><tr>{t.payCols.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{payments.map((p) => <tr key={p._id}><td className="td">{p.date}</td><td className="td"><span className="font-semibold">{p.receiptNo}</span> <button className="ml-2 font-semibold text-brand underline decoration-gold underline-offset-4" onClick={() => printUrl(`/student/receipt/${p._id}`)}>{x("প্রিন্ট")}</button></td><td className="td">{p.invoice?.title}{p.type === "refund" && ` (${t.refund})`}</td><td className="td">{methodLabel[p.method]}</td><td className="td font-semibold">{p.type === "refund" ? "−" : ""}{money(p.amount)}</td></tr>)}
              {payments.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={5}>{t.noPay}</td></tr>}</tbody></table></div>
        </>}

        {tab === "exam" && <StudentExams refreshKey={rk} onPay={(id) => { setPreInv(id); setTab("fee"); }} />}
        {tab === "rt" && (routine ? <RoutineSheet items={routine.items} mode="student" heading={`${routine.class}${routine.section ? ` (${routine.section})` : ""} — ${s.name}`} filename={`routine-${s.studentId}`} /> : <Loader compact label={t.loading} />)}

        {tab === "res" && <>{Object.keys(groups).length === 0 && <p className="card text-slate-500">{t.noResults}</p>}
          {Object.entries(groups).map(([name, rows]) => { const got = rows.reduce((t, r) => t + r.marks, 0), full = rows.reduce((t, r) => t + r.full, 0); return (
            <div key={name} className="card overflow-x-auto !p-0"><div className="flex items-center justify-between gap-2 pr-4"><Title>{name}</Title><button className="btn-primary !py-1.5 text-sm" onClick={() => printUrl(`/student/result?exam=${encodeURIComponent(rows[0].exam)}&year=${rows[0].year}`)}>{x("রেজাল্ট কার্ড প্রিন্ট")}</button></div><table className="w-full"><thead><tr>{t.resCols.map((h) => <th key={h} className="th">{h}</th>)}<th className="th">{x("গ্রেড")}</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r._id}><td className="td">{r.subject}</td><td className="td">{bn(r.marks)}</td><td className="td">{bn(r.full)}</td><td className={`td font-bold ${gradeOf(r.marks, r.full).g === "F" ? "text-red-600" : "text-brand"}`}>{gradeOf(r.marks, r.full).g}</td></tr>)}<tr className="bg-gold-light/60 font-bold"><td className="td">{t.total}</td><td className="td">{bn(got)}</td><td className="td">{bn(full)} ({bn(Math.round((got / full) * 100))}%)</td><td className="td">{(() => { const sm = summarize(rows); return `${sm.letter} · GPA ${bn(sm.gpa.toFixed(2))}`; })()}</td></tr></tbody></table></div>); })}</>}

        {tab === "lv" && <>
          <form onSubmit={applyLeave} className="card grid gap-4 sm:grid-cols-2"><h2 className="font-display text-xl text-brand-dark sm:col-span-2">{t.newLeave}</h2>
            <div><label className="label">{t.from}</label><input type="date" required min={today} defaultValue={today} className="input" onChange={(e) => setLf({ ...lf, from: e.target.value })} /></div>
            <div><label className="label">{t.to}</label><input type="date" required min={lf.from || today} defaultValue={today} className="input" onChange={(e) => setLf({ ...lf, to: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">{t.reason}</label><textarea required minLength={3} rows={2} className="input" onChange={(e) => setLf({ ...lf, reason: e.target.value })} /></div>
            {lErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{lErr}</p>}<button className="btn-primary sm:col-span-2" disabled={lBusy}>{lBusy ? t.wait : t.apply}</button></form>
          <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[480px]"><thead><tr>{t.leaveCols.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{(leaves || []).map((l) => <tr key={l._id}><td className="td whitespace-nowrap">{l.from}{l.to !== l.from && ` → ${l.to}`}</td><td className="td">{l.reason}</td><td className="td">{t.leaveStatus[l.status]}{l.decisionNote && <span className="block text-xs text-slate-500">{l.decisionNote}</span>}</td><td className="td text-right">{l.status === "pending" && <button className="text-red-600 hover:underline" onClick={() => cancelLeave(l._id)}>{t.cancel}</button>}</td></tr>)}
              {leaves && leaves.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={4}>{t.noLeaves}</td></tr>}{!leaves && <tr><td className="td" colSpan={4}><Loader compact label={t.loading} /></td></tr>}</tbody></table></div>
        </>}

        {tab === "not" && <>{notices.length === 0 && <p className="card text-slate-500">{t.noNotices}</p>}{notices.map((n) => <article key={n._id} className="card"><p className="text-xs text-slate-500">{bnDate(n.date)}</p><h2 className="text-lg font-bold text-brand-dark">{n.title}</h2>{n.body && <p className="mt-1 whitespace-pre-line text-slate-700">{n.body}</p>}{n.fileUrl && <a href={n.fileUrl} target="_blank" className="btn-ghost mt-3 !py-1.5 text-sm"><Icon name="file" className="h-4 w-4" /> {t.file}</a>}</article>)}</>}
      </main>
    </div>
  );
}
