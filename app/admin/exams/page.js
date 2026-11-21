"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api, Pager, Toast } from "@/components/CrudPage";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import useSettings from "@/hooks/useSettings";
import { useLang } from "@/components/LangProvider";
import { confirmBox } from "@/components/Dialog";
import { fmtTime } from "@/components/AdmitCardView";
import { todayDhaka } from "@/lib/dates";

const F = ({ l, children, className }) => <div className={className}><label className="label">{l}</label>{children}</div>;
const emptyRow = () => ({ subject: "", date: "", startTime: "10:00", endTime: "12:00" });

export default function Exams() {
  const { x, n, money, date } = useLang(); const st = useSettings();
  const [d, setD] = useState(null); const [page, setPage] = useState(1); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const [subjects, setSubjects] = useState([]); const [cards, setCards] = useState(null); const [arch, setArch] = useState(false);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };
  const load = useCallback(async () => { const r = await api("GET", `/api/exam-notices?page=${page}&limit=20${arch ? "&archived=1" : ""}`); r.ok ? (setD(r.d), setErr("")) : setErr(r.d.error || x("লোড করা যায়নি")); }, [page, arch]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api("GET", "/api/subjects?limit=1000").then((r) => r.ok && setSubjects(r.d.items)); }, []);

  // নির্বাচিত শ্রেণিগুলোর সবগুলোতে থাকা বিষয় (স্বয়ংক্রিয় তালিকা)
  const subjectOpts = useMemo(() => {
    const cls = (form.targets || []).map((t) => t.class);
    if (!cls.length) return [];
    const names = subjects.filter((s) => cls.every((c) => !s.classes?.length || s.classes.includes(c))).map((s) => s.name);
    return [...new Set(names)];
  }, [form.targets, subjects]);
  if (!st) return <Loader compact label={x("লোড হচ্ছে...")} />;

  const toggleTarget = (cls, section) => {
    const cur = form.targets || []; const has = cur.some((t) => t.class === cls && t.section === section);
    let next = has ? cur.filter((t) => !(t.class === cls && t.section === section)) : [...cur.filter((t) => !(t.class === cls && (t.section === "" || section === ""))), { class: cls, section }];
    setForm({ ...form, targets: next });
  };
  const sel = (cls, section) => (form.targets || []).some((t) => t.class === cls && t.section === section);
  const setRow = (i, k, v) => setForm({ ...form, schedule: form.schedule.map((r, j) => (j === i ? { ...r, [k]: v } : r)) });

  async function save(e) {
    e.preventDefault(); setBusy(true); setMErr("");
    const body = { name: form.name, targets: form.targets, schedule: form.schedule, fee: Number(form.fee || 0), instructions: form.instructions };
    const r = form.id ? await api("PUT", `/api/exam-notices/${form.id}`, body) : await api("POST", "/api/exam-notices", body);
    setBusy(false); if (!r.ok) return setMErr(r.d.error || x("সমস্যা হয়েছে"));
    setModal(null); load();
    flash(form.id ? x("✅ নোটিশ হালনাগাদ হয়েছে") : x("✅ {0} টি নোটিশ প্রকাশিত — ফি ইনভয়েস {1}, প্রবেশপত্র {2}", r.d.created.length, r.d.created.reduce((s, c) => s + c.invoices, 0), r.d.created.reduce((s, c) => s + c.cards, 0)));
  }
  async function openCards(e) { const r = await api("GET", `/api/exam-notices/${e._id}/admit-cards`); if (r.ok) setCards({ exam: e, ...r.d }); else flash("⚠ " + (r.d.error || x("লোড করা যায়নি"))); }
  async function sync(e) { const r = await api("POST", `/api/exam-notices/${e._id}/sync`); flash(r.ok ? x("✅ নতুন ইনভয়েস {0}, প্রবেশপত্র {1}", r.d.invoices, r.d.cards) : "⚠ " + r.d.error); }
  async function del(e) {
    const ended = (e.schedule || []).length && [...e.schedule].map((r) => r.date).sort().pop() < todayDhaka();
    const msg = ended ? x("\"{0}\" নোটিশটি সরাবেন? ফি জমা থাকলে নোটিশ শুধু হোমপেজ ও শিক্ষার্থীর তালিকা থেকে সরে যাবে — ইনভয়েস, পেমেন্ট ও প্রবেশপত্রের হিসাব অক্ষত থাকবে।", e.name) : x("\"{0}\" নোটিশটি মুছবেন? ফি জমা না হলে ইনভয়েস বাতিল ও প্রবেশপত্র মুছে যাবে।", e.name);
    if (!(await confirmBox(msg, { danger: true }))) return;
    const r = await api("DELETE", `/api/exam-notices/${e._id}`);
    flash(r.ok ? (r.d.archived ? x("✅ নোটিশ সরানো হয়েছে (হিসাব অক্ষত)") : x("✅ মোছা হয়েছে")) : "⚠ " + r.d.error); load();
  }
  async function restore(e) { const r = await api("PATCH", `/api/exam-notices/${e._id}`, { archived: false }); flash(r.ok ? x("✅ নোটিশ ফিরিয়ে আনা হয়েছে") : "⚠ " + r.d.error); load(); }
  const openNew = () => { setMErr(""); setForm({ name: "", targets: [], schedule: [emptyRow()], fee: "", instructions: "" }); setModal("form"); };
  const openEdit = (e) => { setMErr(""); setForm({ id: e._id, name: e.name, targets: [{ class: e.class, section: e.section || "" }], schedule: e.schedule.map((r) => ({ ...r })), fee: e.fee, instructions: e.instructions || "" }); setModal("form"); };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("পরীক্ষার নোটিশ")}</h1><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={arch} onChange={(e) => { setArch(e.target.checked); setPage(1); }} /> {x("সরানো নোটিশ দেখুন")}</label><button className="btn-primary" onClick={openNew}>{x("+ নতুন নোটিশ")}</button></div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[760px]"><thead><tr>{["পরীক্ষা", "শ্রেণি/শাখা", "তারিখ", "বিষয়", "ফি", ""].map((h, i) => <th key={i} className="th">{x(h)}</th>)}</tr></thead>
        <tbody>{d?.items.map((e) => { const ds = e.schedule.map((r) => r.date).sort(); return <tr key={e._id}><td className="td font-semibold">{e.name}<span className="block text-xs font-normal text-slate-500">{e.createdByName}</span>{ds.length > 0 && ds[ds.length - 1] < todayDhaka() && <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">{x("পরীক্ষা শেষ")}</span>}</td><td className="td">{x(e.class)}{e.section ? ` (${e.section})` : ` — ${x("সব শাখা")}`}</td><td className="td whitespace-nowrap">{date(ds[0])}{ds.length > 1 && ` → ${date(ds[ds.length - 1])}`}</td><td className="td">{x("{0} টি", e.schedule.length)}</td><td className="td">{e.fee > 0 ? money(e.fee) : "—"}</td>
          <td className="td whitespace-nowrap text-right"><Link target="_blank" href={`/exam-notice/${e._id}`} className="mr-3 font-semibold text-brand">{x("PDF/প্রিন্ট")}</Link><button className="mr-3 font-semibold text-slate-700" onClick={() => openCards(e)}>{x("প্রবেশপত্র")}</button>{arch ? <button className="font-semibold text-brand" onClick={() => restore(e)}>{x("ফিরিয়ে আনুন")}</button> : <><button className="mr-3 font-semibold text-slate-700" onClick={() => sync(e)}>{x("নতুনদের যোগ")}</button><button className="mr-3 font-semibold text-slate-700" onClick={() => openEdit(e)}>{x("সম্পাদনা")}</button><button className="font-semibold text-red-600" onClick={() => del(e)}>{x("মুছুন / সরান")}</button></>}</td></tr>; })}
          {d && d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={6}>{arch ? x("কোনো সরানো নোটিশ নেই") : x("কোনো নোটিশ নেই")}</td></tr>}</tbody></table></div>
      {d && <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />}

      {modal === "form" && <Modal wide title={form.id ? x("নোটিশ সম্পাদনা") : x("নতুন পরীক্ষার নোটিশ")} onClose={() => setModal(null)}><form className="space-y-4" onSubmit={save}>
        <F l={x("পরীক্ষার নাম")}><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={x("যেমন: অর্ধবার্ষিক পরীক্ষা ২০২৬")} /></F>
        {!form.id && <div><label className="label">{x("শ্রেণি ও শাখা")}</label>
          <div className="space-y-1.5 rounded-lg border border-slate-200 p-3">{st.classes.map((c) => <div key={c.name} className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="w-16 font-semibold">{x(c.name)}</span>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={sel(c.name, "")} onChange={() => toggleTarget(c.name, "")} /> {x("সব শাখা")}</label>
            {(c.sections || []).map((s) => <label key={s} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={sel(c.name, s)} onChange={() => toggleTarget(c.name, s)} /> {s}</label>)}</div>)}</div></div>}
        <div><label className="label">{x("পরীক্ষার রুটিন (বিষয় সংশ্লিষ্ট শ্রেণির তালিকা থেকে আসে)")}</label>
          {!form.id && !subjectOpts.length && <p className="mb-2 text-sm text-amber-700">{x("আগে শ্রেণি বাছাই করুন; শ্রেণির বিষয় না থাকলে \"শ্রেণি-বিষয়-নিয়োগ\" পেজে বিষয় যোগ করুন।")}</p>}
          <div className="space-y-2">{form.schedule.map((r, i) => <div key={i} className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[1.4fr_1fr_.8fr_.8fr_auto]">
            <select required className="input" value={r.subject} onChange={(e) => setRow(i, "subject", e.target.value)}><option value="">{x("— বিষয় —")}</option>{[...new Set([...subjectOpts, ...(r.subject ? [r.subject] : [])])].map((s) => <option key={s} value={s}>{x(s)}</option>)}</select>
            <input required type="date" className="input" value={r.date} onChange={(e) => setRow(i, "date", e.target.value)} aria-label={x("তারিখ")} />
            <input required type="time" className="input" value={r.startTime} onChange={(e) => setRow(i, "startTime", e.target.value)} aria-label={x("শুরু")} />
            <input required type="time" className="input" value={r.endTime} onChange={(e) => setRow(i, "endTime", e.target.value)} aria-label={x("শেষ")} />
            <button type="button" className="px-2 text-red-600" aria-label={x("মুছুন")} onClick={() => setForm({ ...form, schedule: form.schedule.filter((_, j) => j !== i) })}>✕</button></div>)}</div>
          <button type="button" className="btn-ghost mt-2 !py-1.5" onClick={() => setForm({ ...form, schedule: [...form.schedule, emptyRow()] })}>{x("+ বিষয় যোগ")}</button></div>
        <div className="grid gap-3 sm:grid-cols-2"><F l={x("পরীক্ষার ফি (৳, ০ = ফি নেই)")}><input type="number" min="0" step="0.01" disabled={!!form.id} className="input" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></F></div>
        <F l={x("নির্দেশনা")}><textarea rows={3} className="input" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : form.id ? x("সংরক্ষণ") : x("নোটিশ প্রকাশ করুন")}</button></form></Modal>}

      {cards && <Modal wide title={`${cards.exam.name} — ${x("প্রবেশপত্র")}`} onClose={() => setCards(null)}>
        <p className="mb-3 text-sm text-slate-600">{x("মোট শিক্ষার্থী {0}, প্রবেশপত্র তৈরি {1}। ফি অনুমোদনের আগে প্রবেশপত্র খোলা যায় না।", cards.students, cards.items.length)}</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{["রোল", "নাম", "প্রবেশপত্র নং", "অবস্থা", ""].map((h, i) => <th key={i} className="th">{x(h)}</th>)}</tr></thead><tbody>{cards.items.map((c) => <tr key={c._id}><td className="td">{n(c.roll)}</td><td className="td">{c.student?.name}</td><td className="td">{c.admitNo}</td><td className="td">{c.eligible ? <span className="text-brand">{x("যোগ্য")}</span> : <span className="text-red-600">{x("ফি অনিষ্পন্ন")}</span>}</td><td className="td text-right">{c.eligible && <a target="_blank" className="font-semibold text-brand" href={`/admin/admit/${c._id}`}>{x("খুলুন")}</a>}</td></tr>)}
          {cards.items.length === 0 && <tr><td className="td py-6 text-center text-slate-500" colSpan={5}>{x("এখনও কোনো প্রবেশপত্র নেই (ফি অনুমোদন হলে তৈরি হবে)")}</td></tr>}</tbody></table></div></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
