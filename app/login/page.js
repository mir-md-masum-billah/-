"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { school } from "@/lib/school";
import { schoolEn } from "@/lib/translations";
import { useLang } from "@/components/LangProvider";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";
import Crest from "@/components/Crest";
import Icon from "@/components/Icon";

export default function Login() {
  const { lang, t: all } = useLang(); const t = all.login;
  const schoolName = lang === "en" ? schoolEn.name : school.name;
  const [f, setF] = useState({ userId: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // আগে থেকেই লগইন থাকলে লগইন ফর্ম না দেখিয়ে সরাসরি ড্যাশবোর্ডে
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((m) => { if (m?.role) location.replace(m.role === "student" ? "/student" : "/admin"); }).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); setBusy(false); return; }
    location.href = d.role === "student" ? "/student" : "/admin";
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="lattice hero-glow hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white"><Icon name="arrowLeft" className="h-4 w-4" /> {t.home}</Link>
          <span className="flex items-center gap-2"><LanguageSwitch /><ThemeToggle /></span>
        </div>
        <div>
          <Crest className="h-24 w-auto text-gold-soft" />
          <h1 className="mt-8 text-5xl leading-[1.25] text-white xl:text-6xl">{schoolName}</h1>
          <span className="gold-rule mt-6" />
          <p className="mt-6 max-w-md text-lg text-white/75">{t.portal}</p>
        </div>
        <p className="text-sm text-white/55">{t.hint}</p>
      </section>

      <section className="relative flex items-center justify-center bg-pearl p-6">
        <div className="absolute right-4 top-4 flex items-center gap-2 lg:hidden"><LanguageSwitch tone="light" /><ThemeToggle tone="light" /></div>
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-3 text-brand lg:hidden">
            <Crest className="h-9 w-auto text-gold-deep" /><span className="font-display text-xl">{schoolName}</span>
          </Link>
          <form onSubmit={submit} className="space-y-5 rounded-2xl border border-brand/10 border-t-2 border-t-gold bg-white p-7 shadow-lux">
            <div>
              <h2 className="font-display text-3xl text-brand-dark">{t.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.sub}</p>
            </div>
            <div><label className="label" htmlFor="uid">{t.id}</label><input id="uid" className="input" value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })} autoComplete="username" required /></div>
            <div><label className="label" htmlFor="pw">{t.pw}</label><input id="pw" type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" required /></div>
            {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
            <button className="btn-primary w-full !py-3 text-base" disabled={busy}>{busy ? t.busy : t.submit}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500 lg:hidden">{t.hint}</p>
        </div>
      </section>
    </main>
  );
}
