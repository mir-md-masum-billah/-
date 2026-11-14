"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/components/CrudPage";
import { parseCSV, toCSV, download } from "@/lib/csv";

const COLS = ["studentId", "name", "class", "section", "roll", "session", "gender", "fatherName", "motherName", "guardianName", "guardianPhone", "phone", "address", "birthRegNo", "dob", "admissionDate", "monthlyFee", "previousSchool", "previousClass"];
export default function Import() {
  const [rows, setRows] = useState([]); const [errs, setErrs] = useState([]); const [msg, setMsg] = useState(""); const [creds, setCreds] = useState(null); const [busy, setBusy] = useState(false); const [ok, setOk] = useState(false);
  async function file(e) {
    setErrs([]); setMsg(""); setCreds(null); setOk(false);
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 1e6) return setMsg("ফাইল খুব বড়");
    const r = parseCSV(await f.text()); setRows(r);
    if (!r.length) return setMsg("ফাইলে কোনো সারি নেই");
    setBusy(true); const v = await api("POST", "/api/students/import", { rows: r, dryRun: true }); setBusy(false);
    if (v.ok) { setOk(true); setMsg(`✅ ${v.d.valid} টি সারি বৈধ — আমদানি করা যাবে`); } else { setErrs(v.d.errors || [{ row: "-", error: v.d.error }]); }
  }
  async function go() { setBusy(true); const r = await api("POST", "/api/students/import", { rows }); setBusy(false); if (!r.ok) return setErrs(r.d.errors || [{ row: "-", error: r.d.error }]); setCreds(r.d.credentials); setOk(false); setMsg(`✅ ${r.d.created} জন ভর্তি হয়েছে`); }
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/students" className="text-brand">← শিক্ষার্থী তালিকা</Link>
      <h1 className="text-2xl font-bold">শিক্ষার্থী আমদানি (CSV)</h1>
      <div className="card space-y-3 text-sm"><p>Excel/Google Sheets থেকে <b>CSV (UTF-8)</b> হিসেবে সংরক্ষণ করুন। শুধু <b>name</b> ও <b>class</b> আবশ্যক; আইডি, রোল ফাঁকা থাকলে স্বয়ংক্রিয় বসবে, পাসওয়ার্ড সবার জন্য স্বয়ংক্রিয়। একটি সারিতেও ভুল থাকলে কাউকে আমদানি করা হয় না। সর্বোচ্চ ২০০ জন।</p>
        <button className="btn-ghost" onClick={() => download("student-template.csv", toCSV([{ name: "নমুনা শিক্ষার্থী", class: "৫ম", section: "", roll: "", fatherName: "নমুনা পিতা", guardianPhone: "01712345678", monthlyFee: 500 }], COLS))}>নমুনা ফাইল নামান</button>
        <input type="file" accept=".csv,text/csv" onChange={file} /></div>
      {msg && <p className="rounded-lg bg-brand-light p-3 font-semibold text-brand">{msg}</p>}
      {errs.length > 0 && <div className="card border-red-300"><h2 className="mb-2 font-bold text-red-700">{errs.length} টি ভুল — ঠিক করে আবার দিন</h2><ul className="max-h-64 overflow-y-auto text-sm">{errs.map((e, i) => <li key={i} className="border-b border-slate-100 py-1">সারি {e.row}: {e.error}</li>)}</ul></div>}
      {ok && <button className="btn-primary" disabled={busy} onClick={go}>{busy ? "আমদানি হচ্ছে..." : `${rows.length} জনকে আমদানি করুন`}</button>}
      {creds && <div className="card space-y-2"><p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">⚠ পাসওয়ার্ড আর দেখানো হবে না। এখনই ফাইল নামিয়ে নিরাপদে রাখুন এবং অভিভাবকদের দিন।</p>
        <button className="btn-primary" onClick={() => download("student-logins.csv", toCSV(creds, ["studentId", "name", "password"]))}>লগইন তথ্য CSV নামান</button></div>}
    </div>
  );
}
