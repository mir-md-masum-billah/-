"use client";
import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import useMe from "@/hooks/useMe";
import { api, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { confirmBox } from "@/components/Dialog";

const T = { admission: "ভর্তি", promotion: "প্রমোশন", class_change: "শ্রেণি/রোল পরিবর্তন", transferred: "বদলি", passed: "পাস করে বের", dropped: "ঝরে পড়া", reactivated: "পুনরায় সক্রিয়" };
const SL = { active: "সক্রিয়", transferred: "বদলি হয়েছে", passed: "পাস করেছে", dropped: "ঝরে পড়েছে" };

export default function Profile({ params }) {
  const { id } = use(params); const me = useMe(); const { x, n, money, date } = useLang();
  const [d, setD] = useState(null); const [err, setErr] = useState(""); const [toast, setToast] = useState(""); const [subs, setSubs] = useState([]);
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const load = useCallback(async () => { const r = await api("GET", `/api/students/${id}/profile`); if (r.ok) setD(r.d); else setErr(r.d.error || x("লোড করা যায়নি")); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api("GET", "/api/subjects?type=optional&limit=200").then((r) => r.ok && setSubs(r.d.items)); }, []);
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const s = d.student, can = (p) => me.perms.includes(p);
  const mySubs = (s.optionalSubjects || []).map((o) => o._id);
  const offered = subs.filter((o) => !o.classes?.length || o.classes.includes(s.class));

  async function act(method, url, body, msg, after) { setBusy(true); setMErr(""); const r = await api(method, url, body); setBusy(false); if (!r.ok) { setMErr(r.d.error || x("সমস্যা হয়েছে")); return false; } setModal(null); flash(msg(r.d)); after?.(); load(); return true; }
  async function uploadDoc(e) {
    e.preventDefault(); const file = form.file; if (!file || !form.name) return setMErr(x("নাম ও ফাইল দিন"));
    setBusy(true); setMErr(""); const fd = new FormData(); fd.append("file", file);
    try { const u = await (await fetch("/api/upload", { method: "POST", body: fd })).json(); if (!u.url) { setBusy(false); return setMErr(u.error || x("আপলোড ব্যর্থ")); } await act("POST", `/api/students/${id}/documents`, { name: form.name, url: u.url }, () => x("✅ কাগজ যোগ হয়েছে")); }
    catch { setMErr(x("আপলোড ব্যর্থ — নেটওয়ার্ক সমস্যা")); } setBusy(false);
  }
  const toggleSub = (sid) => act("PUT", `/api/students/${id}/subjects`, { subjects: mySubs.includes(sid) ? mySubs.filter((o) => o !== sid) : [...mySubs, sid] }, () => x("✅ সংরক্ষিত"));

  return (
    <div className="space-y-5">
      <Link href="/admin/students" className="text-brand print:hidden">{x("← শিক্ষার্থী তালিকা")}</Link>
      <div className="card flex flex-wrap items-center gap-4">
        {s.photo ? <img src={s.photo} alt="" className="h-24 w-24 rounded-full object-cover" /> : <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-light text-4xl font-bold text-brand">{s.name[0]}</div>}
        <div className="mr-auto"><h1 className="text-3xl text-brand-dark">{s.name}</h1><p className="text-slate-600">{x("আইডি")} {s.studentId} · {x("শ্রেণি")} {x(s.class)}{s.section ? ` (${s.section})` : ""} · {x("রোল")} {s.roll}{s.session ? ` · ${x("সেশন")} ${s.session}` : ""}</p>
          <p className="mt-1"><span className={`rounded px-2 py-0.5 text-sm ${s.status === "active" ? "bg-brand-light text-brand" : "bg-amber-100 text-amber-800"}`}>{x(SL[s.status || "active"])}</span>{s.leftReason && <span className="ml-2 text-sm text-slate-500">{s.leftDate && date(s.leftDate)} · {s.leftReason}</span>}</p></div>
        {d.due !== undefined && <div className="text-right"><p className="text-sm text-slate-500">{x("বকেয়া ফি")}</p><p className={`text-xl font-bold ${d.due > 0 ? "text-red-600" : "text-brand"}`}>{money(d.due)}</p></div>}
        {can("students.promote") && <div className="flex gap-2 print:hidden">
          {s.status === "active" ? <button className="btn-ghost" onClick={() => { setMErr(""); setForm({ type: "transferred" }); setModal("status"); }}>{x("বদলি / পাস / ঝরে পড়া")}</button>
            : <button className="btn-primary" onClick={() => act("POST", `/api/students/${id}/status`, { type: "reactivated" }, () => x("✅ পুনরায় সক্রিয়"))}>{x("পুনরায় সক্রিয় করুন")}</button>}</div>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card text-sm"><h2 className="mb-2 text-base font-bold">{x("ব্যক্তিগত তথ্য")}</h2>
          {[["লিঙ্গ", { male: x("ছেলে"), female: x("মেয়ে"), other: x("অন্যান্য") }[s.gender]], ["জন্ম তারিখ", s.dob && date(s.dob)], ["জন্মনিবন্ধন নং", s.birthRegNo], ["পিতা", s.fatherName], ["মাতা", s.motherName], ["অভিভাবক", s.guardianName], ["অভিভাবকের ফোন", s.guardianPhone], ["ফোন", [s.phone, ...(s.otherPhones || [])].filter(Boolean).join(", ")], ["ঠিকানা", s.address], ["আগের স্কুল", [s.previousSchool, s.previousClass && x(s.previousClass)].filter(Boolean).join(" — ")], ["ভর্তির তারিখ", s.admissionDate && date(s.admissionDate)], ["মাসিক বেতন", money(s.monthlyFee)]].map(([k, v]) => <p key={k} className="border-b border-slate-100 py-1.5 last:border-0"><span className="text-slate-500">{x(k)}: </span>{v || "—"}</p>)}</div>
        <div className="space-y-4">
          <div className="card"><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">{x("ভর্তির কাগজপত্র")}</h2>{can("students.write") && <button className="btn-ghost !py-1.5 print:hidden" onClick={() => { setMErr(""); setForm({}); setModal("doc"); }}>{x("+ কাগজ")}</button>}</div>
            {s.documents?.length ? s.documents.map((o) => <div key={o._id} className="flex justify-between border-b border-slate-100 py-1.5 text-sm last:border-0"><a href={o.url} target="_blank" className="text-brand underline">{o.name}</a>{can("students.write") && <button className="text-red-600" onClick={async () => (await confirmBox(x("মুছবেন?"), { danger: true })) && act("DELETE", `/api/students/${id}/documents?doc=${o._id}`, null, () => x("✅ মোছা হয়েছে"))}>{x("মুছুন")}</button>}</div>) : <p className="text-sm text-slate-500">{x("কোনো কাগজ নেই")}</p>}</div>
          <div className="card"><h2 className="mb-2 font-bold">{x("ঐচ্ছিক বিষয়")}</h2>
            {offered.length === 0 ? <p className="text-sm text-slate-500">{x("এই শ্রেণিতে কোনো ঐচ্ছিক বিষয় নেই")}</p> : offered.map((o) => <label key={o._id} className="flex items-center gap-2 py-1"><input type="checkbox" disabled={!can("students.write") || busy} checked={mySubs.includes(o._id)} onChange={() => toggleSub(o._id)} />{o.name}</label>)}</div>
        </div>
      </div>

      <div className="card"><h2 className="mb-3 font-bold">{x("শিক্ষার্থীর ইতিহাস")}</h2>
        <ol className="space-y-3 border-l-2 border-brand/30 pl-4">{d.history.map((h) => (
          <li key={h._id}><p className="font-semibold">{x(T[h.type])} <span className="text-sm font-normal text-slate-500">· {date(h.date || new Date(h.createdAt).toISOString().slice(0, 10))}{h.byName ? ` · ${h.byName}` : ""}</span></p>
            <p className="text-sm text-slate-600">{h.fromClass && `${x(h.fromClass)}${h.fromSection ? "(" + h.fromSection + ")" : ""} ${x("রোল")} ${n(h.fromRoll)}`}{h.fromClass && h.toClass && " → "}{h.toClass && `${x(h.toClass)}${h.toSection ? "(" + h.toSection + ")" : ""} ${x("রোল")} ${n(h.toRoll)}`}{h.session && ` · ${x("সেশন")} ${h.session}`}{h.note && ` · ${h.note}`}</p></li>))}
          {d.history.length === 0 && <li className="text-slate-500">{x("কোনো ইতিহাস নেই")}</li>}</ol></div>

      {modal === "status" && <Modal title={x("অবস্থা পরিবর্তন")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); act("POST", `/api/students/${id}/status`, form, (r) => x("✅ সম্পন্ন") + (r.due ? x(" — বকেয়া {0} টাকা আছে", money(r.due)) : "")); }}>
        <div><label className="label">{x("ধরন")}</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="transferred">{x("বদলি (TC)")}</option><option value="passed">{x("পাস করে বের")}</option><option value="dropped">{x("ঝরে পড়া")}</option></select></div>
        <div><label className="label">{x("কারণ")} {form.type !== "passed" && x("(আবশ্যক)")}</label><input className="input" onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        {form.type === "transferred" && <div><label className="label">{x("নতুন স্কুল")}</label><input className="input" onChange={(e) => setForm({ ...form, toSchool: e.target.value })} /></div>}
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{x("লগইন বন্ধ হবে; হাজিরা, ফি ও ফলাফলের ইতিহাস থেকে যাবে।")}</p>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{x("নিশ্চিত করুন")}</button></form></Modal>}
      {modal === "doc" && <Modal title={x("কাগজ যোগ করুন")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={uploadDoc}>
        <div><label className="label">{x("কাগজের নাম (যেমন: জন্মনিবন্ধন)")}</label><input required className="input" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">{x("ফাইল (JPG/PNG/PDF, ≤৫MB)")}</label><input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} /></div>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? x("আপলোড হচ্ছে...") : x("আপলোড")}</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
