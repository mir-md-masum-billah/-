"use client";
import { useState } from "react";
import Link from "next/link";
import { school } from "@/lib/school";

export default function Login() {
  const [f, setF] = useState({ userId: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); setBusy(false); return; }
    location.href = d.role === "student" ? "/student" : "/admin";
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-lg font-semibold">← হোমপেজ</Link>
        <div>
          <h1 className="text-5xl font-bold leading-tight">{school.name}</h1>
          <p className="mt-4 max-w-md text-lg text-white/80">শিক্ষার্থী, অভিভাবক ও শিক্ষকদের জন্য অনলাইন পোর্টাল।</p>
        </div>
        <p className="text-sm text-white/60">আইডি ও পাসওয়ার্ড স্কুল অফিস থেকে সংগ্রহ করুন।</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="card w-full max-w-sm space-y-4 !p-6">
          <div className="lg:hidden"><Link href="/" className="text-sm text-brand">← হোমপেজ</Link></div>
          <h2 className="text-2xl font-bold">লগইন করুন</h2>
          <div><label className="label">আইডি</label><input className="input" value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })} autoComplete="username" required /></div>
          <div><label className="label">পাসওয়ার্ড</label><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" required /></div>
          {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "অপেক্ষা করুন..." : "লগইন"}</button>
        </form>
      </section>
    </main>
  );
}
