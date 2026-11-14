"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { school } from "@/lib/school";

export default function Admission() {
  const [f, setF] = useState({ website: "" }); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const [classes, setClasses] = useState([]);
  useEffect(() => { fetch("/api/public/classes").then((r) => r.json()).then((d) => setClasses(d.classes || [])).catch(() => {}); }, []);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const d = await r.json(); if (!r.ok) setErr(d.error || "সমস্যা হয়েছে"); else setDone(true); }
    catch { setErr("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন"); }
    setBusy(false);
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  if (done) return <main className="grid min-h-screen place-items-center p-6"><div className="card max-w-md text-center"><p className="text-5xl">✅</p><h1 className="mt-2 text-2xl font-bold">আবেদন জমা হয়েছে</h1><p className="mt-2 text-slate-600">স্কুল অফিস যাচাই করে আপনার মোবাইল নম্বরে যোগাযোগ করবে।</p><Link href="/" className="btn-primary mt-4">হোমপেজে ফিরুন</Link></div></main>;
  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <Link href="/" className="text-brand">← হোমপেজ</Link>
      <h1 className="mb-1 mt-2 text-3xl font-bold">ভর্তির আবেদন</h1><p className="mb-5 text-slate-600">{school.name}</p>
      <form onSubmit={submit} className="card grid gap-4 sm:grid-cols-2">
        <div className="hidden" aria-hidden="true"><label>ওয়েবসাইট<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label></div>
        <div className="sm:col-span-2"><label className="label">শিক্ষার্থীর নাম <span className="text-red-600">*</span></label><input required minLength={2} className="input" onChange={set("name")} /></div>
        <div><label className="label">যে শ্রেণিতে ভর্তি হতে চায় <span className="text-red-600">*</span></label><select required className="input" onChange={set("class")}><option value="">— বাছাই করুন —</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label">লিঙ্গ</label><select className="input" onChange={set("gender")}><option value="">—</option><option value="male">ছেলে</option><option value="female">মেয়ে</option><option value="other">অন্যান্য</option></select></div>
        <div><label className="label">জন্ম তারিখ</label><input type="date" className="input" onChange={set("dob")} /></div>
        <div><label className="label">অভিভাবকের মোবাইল <span className="text-red-600">*</span></label><input required inputMode="tel" placeholder="01712345678" className="input" onChange={set("phone")} /></div>
        <div><label className="label">পিতার নাম <span className="text-red-600">*</span></label><input required className="input" onChange={set("fatherName")} /></div>
        <div><label className="label">মাতার নাম</label><input className="input" onChange={set("motherName")} /></div>
        <div className="sm:col-span-2"><label className="label">ঠিকানা</label><input className="input" onChange={set("address")} /></div>
        <div><label className="label">আগের স্কুল (থাকলে)</label><input className="input" onChange={set("previousSchool")} /></div>
        <div><label className="label">আগের শ্রেণি</label><input className="input" onChange={set("previousClass")} /></div>
        {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{err}</p>}
        <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}</button>
      </form>
    </main>
  );
}
