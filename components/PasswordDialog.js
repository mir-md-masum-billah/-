"use client";
import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { useLang } from "./LangProvider";

// নিজের পাসওয়ার্ড বদলানোর বাটন + ডায়ালগ (অ্যাডমিন সাইডবার ও শিক্ষার্থী পোর্টালে)
export default function PasswordDialog({ className = "btn-ghost" }) {
  const { x } = useLang();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);

  const close = () => { setOpen(false); setF({ current: "", next: "", again: "" }); setErr(""); setDone(false); };
  async function submit(e) {
    e.preventDefault(); setErr("");
    if (f.next.length < 8) return setErr(x("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"));
    if (f.next !== f.again) return setErr(x("নতুন পাসওয়ার্ড দুই জায়গায় মেলেনি"));
    setBusy(true);
    try {
      const r = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: f.current, next: f.next }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErr(d.error || x("সমস্যা হয়েছে")); else setDone(true);
    } catch { setErr(x("নেটওয়ার্ক সমস্যা — ইন্টারনেট যাচাই করুন")); }
    setBusy(false);
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}><Icon name="shield" className="h-4 w-4" /> {x("পাসওয়ার্ড বদলান")}</button>
      {open && (
        <Modal title={x("পাসওয়ার্ড বদলান")} onClose={close}>
          {done ? (
            <div className="space-y-4"><p className="rounded-lg bg-brand-light p-3 text-brand-dark">{x("✅ পাসওয়ার্ড বদলানো হয়েছে")}</p><button className="btn-primary w-full" onClick={close}>{x("বন্ধ করুন")}</button></div>
          ) : (
            <form className="space-y-3" onSubmit={submit}>
              <div><label className="label" htmlFor="pw-cur">{x("বর্তমান পাসওয়ার্ড")}</label><input id="pw-cur" type="password" required autoComplete="current-password" className="input" value={f.current} onChange={set("current")} /></div>
              <div><label className="label" htmlFor="pw-new">{x("নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)")}</label><input id="pw-new" type="password" required minLength={8} autoComplete="new-password" className="input" value={f.next} onChange={set("next")} /></div>
              <div><label className="label" htmlFor="pw-again">{x("নতুন পাসওয়ার্ড আবার লিখুন")}</label><input id="pw-again" type="password" required minLength={8} autoComplete="new-password" className="input" value={f.again} onChange={set("again")} /></div>
              {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : x("সংরক্ষণ করুন")}</button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
