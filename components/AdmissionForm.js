"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useLang } from "./LangProvider";

const Req = () => <span className="text-red-600"> *</span>;

export default function AdmissionForm() {
  const { t: all } = useLang(); const t = all.admission;
  const [f, setF] = useState({ website: "" }); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const [classes, setClasses] = useState([]);
  useEffect(() => { fetch("/api/public/classes").then((r) => r.json()).then((d) => setClasses(d.classes || [])).catch(() => {}); }, []);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const d = await r.json(); if (!r.ok) setErr(d.error || t.errGeneric); else setDone(true); }
    catch { setErr(t.errNet); }
    setBusy(false);
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (done) return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand/10 border-t-2 border-t-gold bg-white p-10 text-center shadow-lux">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold bg-gold-light text-gold-deep"><Icon name="check" className="h-8 w-8" /></span>
      <h2 className="mt-5 font-display text-3xl text-brand-dark">{t.doneTitle}</h2>
      <p className="mt-2 text-slate-600">{t.doneBody}</p>
      <Link href="/" className="btn-primary mt-6">{t.back}</Link>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-10 rounded-2xl border border-brand/10 border-t-2 border-t-gold bg-white p-6 shadow-lux sm:p-10">
      <div className="hidden" aria-hidden="true"><label>{t.website}<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label></div>

      <section>
        <h2 className="mb-5 border-b border-gold/40 pb-2 font-display text-2xl text-brand-dark">{t.student}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">{t.name}<Req /></label><input required minLength={2} className="input" onChange={set("name")} /></div>
          <div><label className="label">{t.cls}<Req /></label><select required className="input" onChange={set("class")}><option value="">{t.pick}</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">{t.gender}</label><select className="input" onChange={set("gender")}><option value="">—</option><option value="male">{t.male}</option><option value="female">{t.female}</option><option value="other">{t.other}</option></select></div>
          <div><label className="label">{t.dob}</label><input type="date" className="input" onChange={set("dob")} /></div>
        </div>
      </section>

      <section>
        <h2 className="mb-5 border-b border-gold/40 pb-2 font-display text-2xl text-brand-dark">{t.guardian}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label">{t.father}<Req /></label><input required className="input" onChange={set("fatherName")} /></div>
          <div><label className="label">{t.mother}</label><input className="input" onChange={set("motherName")} /></div>
          <div><label className="label">{t.phone}<Req /></label><input required inputMode="tel" placeholder="01712345678" className="input" onChange={set("phone")} /></div>
          <div><label className="label">{t.address}</label><input className="input" onChange={set("address")} /></div>
        </div>
      </section>

      <section>
        <h2 className="mb-5 border-b border-gold/40 pb-2 font-display text-2xl text-brand-dark">{t.previous}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label className="label">{t.prevSchool}</label><input className="input" onChange={set("previousSchool")} /></div>
          <div><label className="label">{t.prevClass}</label><input className="input" onChange={set("previousClass")} /></div>
        </div>
      </section>

      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full !py-3 text-base" disabled={busy}>{busy ? t.busy : t.submit}</button>
    </form>
  );
}
