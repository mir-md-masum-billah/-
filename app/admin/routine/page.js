"use client";
import { useEffect, useState, useCallback } from "react";
import { api, Toast } from "@/components/CrudPage";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import RoutineSheet from "@/components/RoutineSheet";
import useSettings from "@/hooks/useSettings";
import { useLang } from "@/components/LangProvider";
import { confirmBox } from "@/components/Dialog";
import { fmtTime } from "@/components/AdmitCardView";
import { DAYS } from "@/lib/routine-days";

const F = ({ l, children }) => <div><label className="label">{l}</label>{children}</div>;

export default function Routine() {
  const { x } = useLang(); const st = useSettings();
  const [view, setView] = useState("teacher"); const [teachers, setTeachers] = useState([]); const [subjects, setSubjects] = useState([]);
  const [fT, setFT] = useState(""); const [fC, setFC] = useState(""); const [fS, setFS] = useState("");
  const [items, setItems] = useState(null); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const [modal, setModal] = useState(false); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  useEffect(() => { api("GET", "/api/staff?role=teacher,headmaster,admin,superadmin&active=true&limit=500").then((r) => { if (r.ok) { setTeachers(r.d.items); setFT((v) => v || r.d.items[0]?._id || ""); } }); api("GET", "/api/subjects?limit=1000").then((r) => r.ok && setSubjects(r.d.items)); }, []);
  const q = view === "teacher" ? (fT ? `teacher=${fT}` : "") : (fC ? `class=${encodeURIComponent(fC)}${fS ? `&section=${encodeURIComponent(fS)}` : ""}` : "");
  const load = useCallback(async () => { if (!q) { setItems([]); return; } const r = await api("GET", `/api/routines?${q}`); r.ok ? (setItems(r.d.items), setErr("")) : setErr(r.d.error || x("লোড করা যায়নি")); }, [q]);
  useEffect(() => { load(); }, [load]);
  if (!st) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const secs = (c) => st.classes.find((k) => k.name === c)?.sections || [];
  const subOpts = (c) => [...new Set(subjects.filter((s) => !s.classes?.length || s.classes.includes(c)).map((s) => s.name))];
  const openNew = () => { setMErr(""); setForm({ teacher: view === "teacher" ? fT : "", class: view === "class" ? fC : "", section: view === "class" ? fS : "", subject: "", day: 0, startTime: "09:00", endTime: "09:45" }); setModal(true); };
  const openEdit = (r) => { setMErr(""); setForm({ id: r._id, teacher: r.teacher?._id, class: r.class, section: r.section || "", subject: r.subject, day: r.day, startTime: r.startTime, endTime: r.endTime }); setModal(true); };
  async function save(e) { e.preventDefault(); setBusy(true); setMErr(""); const b = { teacher: form.teacher, class: form.class, section: form.section, subject: form.subject, day: Number(form.day), startTime: form.startTime, endTime: form.endTime }; const r = form.id ? await api("PUT", `/api/routines/${form.id}`, b) : await api("POST", "/api/routines", b); setBusy(false); if (!r.ok) return setMErr(r.d.error || x("সমস্যা হয়েছে")); setModal(false); flash(x("✅ সংরক্ষিত")); load(); }
  async function del(r) { if (!(await confirmBox(x("এই ক্লাসটি রুটিন থেকে সরাবেন?"), { danger: true }))) return; const res = await api("DELETE", `/api/routines/${r._id}`); flash(res.ok ? x("✅ সরানো হয়েছে") : "⚠ " + res.d.error); load(); }
  const tName = teachers.find((t) => t._id === fT)?.name;
  return (
    <div>
      <div className="no-print">
        <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("ক্লাস রুটিন")}</h1><button className="btn-primary" onClick={openNew}>{x("+ ক্লাস যোগ")}</button></div>
        <div className="mb-3 flex gap-2 border-b">{[["teacher", "শিক্ষক অনুযায়ী"], ["class", "শ্রেণি-শাখা অনুযায়ী"]].map(([k, l]) => <button key={k} onClick={() => setView(k)} className={`px-4 py-2 font-semibold ${view === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{x(l)}</button>)}</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {view === "teacher" ? <select className="input !w-auto" value={fT} onChange={(e) => setFT(e.target.value)}>{teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
            : <><select className="input !w-auto" value={fC} onChange={(e) => { setFC(e.target.value); setFS(""); }}><option value="">{x("— শ্রেণি —")}</option>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select><select className="input !w-auto" value={fS} onChange={(e) => setFS(e.target.value)}><option value="">{x("সব শাখা")}</option>{secs(fC).map((s) => <option key={s}>{s}</option>)}</select></>}</div>
        {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
        <div className="card mb-6 overflow-x-auto !p-0"><table className="w-full min-w-[640px]"><thead><tr>{["দিন", "সময়", "বিষয়", "শ্রেণি/শাখা", "শিক্ষক", ""].map((h, i) => <th key={i} className="th">{x(h)}</th>)}</tr></thead>
          <tbody>{(items || []).map((r) => <tr key={r._id}><td className="td">{x(DAYS[r.day])}</td><td className="td whitespace-nowrap">{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</td><td className="td font-semibold">{x(r.subject)}</td><td className="td">{x(r.class)}{r.section ? ` (${r.section})` : ""}</td><td className="td">{r.teacher?.name}</td><td className="td whitespace-nowrap text-right"><button className="mr-3 font-semibold text-slate-700" onClick={() => openEdit(r)}>{x("সম্পাদনা")}</button><button className="font-semibold text-red-600" onClick={() => del(r)}>{x("সরান")}</button></td></tr>)}
            {items && items.length === 0 && <tr><td className="td py-8 text-center text-slate-500" colSpan={6}>{x("কোনো ক্লাস নেই")}</td></tr>}{!items && <tr><td className="td" colSpan={6}><Loader compact label={x("লোড হচ্ছে...")} /></td></tr>}</tbody></table></div>
      </div>
      {items && items.length > 0 && <RoutineSheet items={items} mode={view === "teacher" ? "teacher" : "student"} heading={view === "teacher" ? tName : `${fC}${fS ? ` (${fS})` : ""}`} filename={`routine-${view === "teacher" ? tName : fC + fS}`} />}
      {modal && <Modal title={form.id ? x("ক্লাস সম্পাদনা") : x("নতুন ক্লাস")} onClose={() => setModal(false)}><form className="space-y-3" onSubmit={save}>
        <F l={x("শিক্ষকের নাম")}><select required className="input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}><option value="">{x("— বাছাই করুন —")}</option>{teachers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.userId})</option>)}</select></F>
        <div className="grid grid-cols-2 gap-3"><F l={x("শ্রেণি")}><select required className="input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value, section: "", subject: "" })}><option value="">{x("— বাছাই —")}</option>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select></F>
          <F l={x("শাখা")}><select className="input" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}><option value="">{x("সব শাখা")}</option>{secs(form.class).map((s) => <option key={s}>{s}</option>)}</select></F></div>
        <F l={x("বিষয়")}><select required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option value="">{x("— বাছাই করুন —")}</option>{[...new Set([...subOpts(form.class), ...(form.subject ? [form.subject] : [])])].map((s) => <option key={s} value={s}>{x(s)}</option>)}</select></F>
        <F l={x("সপ্তাহের দিন")}><select className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{DAYS.map((d, i) => <option key={i} value={i}>{x(d)}</option>)}</select></F>
        <div className="grid grid-cols-2 gap-3"><F l={x("ক্লাস শুরু")}><input required type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></F><F l={x("ক্লাস শেষ")}><input required type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></F></div>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : x("সংরক্ষণ")}</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
