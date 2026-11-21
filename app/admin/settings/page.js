"use client";
import { useEffect, useRef, useState } from "react";
import { api, Toast } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";
import { roleLabel } from "@/lib/rbac";
import { methodLabel } from "@/lib/school";
import Loader from "@/components/Loader";
import Crest from "@/components/Crest";
import { isPlaceholder } from "@/lib/school";
import { validPhone } from "@/lib/phone";
import useMe from "@/hooks/useMe";

const hints = { address: "গ্রাম/এলাকা, উপজেলা, জেলা", phone: "01XXXXXXXXX", email: "school@example.com" };

// ছবি বাছাই → মাঝখান থেকে বর্গ করে ২৫৬×২৫৬ এ ছোট করা (স্বচ্ছতা ঠিক রেখে PNG; বড় হলে WEBP/JPEG)
async function shrinkImage(file) {
  if (!/^image\/(png|jpe?g|webp|gif|bmp)$/.test(file.type)) throw new Error("type");
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height), N = 256;
  const c = document.createElement("canvas"); c.width = c.height = N;
  c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, N, N);
  let out = c.toDataURL("image/png");
  if (out.length > 90000) out = c.toDataURL("image/webp", 0.85);
  if (!out.startsWith("data:image/webp") && out.length > 90000) out = c.toDataURL("image/jpeg", 0.85);
  return out;
}

export default function SettingsPage() {
  const { x, n } = useLang();
  const me = useMe(); const fileRef = useRef(null);
  const [s, setS] = useState(null); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const load = () => api("GET", "/api/settings").then((r) => (r.ok && r.d.permissionList ? setS({ ...r.d, classText: r.d.classes.map((c) => ({ name: c.name, sections: (c.sections || []).join(", ") })) }) : setErr(r.ok ? x("এই পেজ দেখার অনুমতি আপনার নেই।") : r.d.error || x("লোড করা যায়নি"))));
  useEffect(() => { load(); }, []);
  const [cErr, setCErr] = useState("");
  // ফোন নম্বর: ফাঁকা সারি বাদ দিয়ে, ভুল থাকলে ওই অংশেই বার্তা দেখিয়ে সংরক্ষণ
  const [cBusy, setCBusy] = useState(-1);
  // ফোন নম্বরের সাথে ছবি (শুধু হোমপেজের "যোগাযোগের ফোন নম্বর" অংশে দেখায়, "আমাদের সম্পর্কে" অংশে নয়)
  const pickContactPhoto = async (i, file) => {
    if (!file) return; setCErr(""); setCBusy(i);
    try { const fd = new FormData(); fd.append("file", file); const u = await (await fetch("/api/upload", { method: "POST", body: fd })).json(); if (!u.url) setCErr(u.error || x("আপলোড ব্যর্থ")); else setS((p) => ({ ...p, contacts: p.contacts.map((y, j) => (j === i ? { ...y, photo: u.url } : y)) })); } catch { setCErr(x("আপলোড ব্যর্থ — নেটওয়ার্ক সমস্যা")); }
    setCBusy(-1);
  };
  const saveContacts = async () => {
    setCErr("");
    const list = (s.contacts || []).map((c) => ({ role: (c.role || "").trim(), name: (c.name || "").trim(), phone: (c.phone || "").trim(), photo: c.photo || "" })).filter((c) => c.role || c.name || c.phone);
    for (let i = 0; i < list.length; i++) {
      if (!list[i].phone || !validPhone(list[i].phone)) return setCErr(x("{0} নম্বর সারিতে সঠিক ফোন নম্বর দিন (শুধু অঙ্ক, + ও - চলবে)", n(i + 1)));
      if (!list[i].name && !list[i].role) return setCErr(x("{0} নম্বর সারিতে নাম বা পদবী দিন", n(i + 1)));
    }
    const r = await api("PUT", "/api/settings", { contacts: list });
    if (!r.ok) return setCErr(r.d.error || x("সংরক্ষণ ব্যর্থ"));
    setToast(x("✅ সংরক্ষিত")); setTimeout(() => setToast(""), 2500); load();
  };
  const save = async (body, ok = x("✅ সংরক্ষিত")) => { setErr(""); const r = await api("PUT", "/api/settings", body); if (!r.ok) return setErr(r.d.error || x("সংরক্ষণ ব্যর্থ")); setToast(ok); setTimeout(() => setToast(""), 2500); load(); };
  if (err && !s) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (me && !me.perms.includes("settings.manage")) return <p className="rounded-lg bg-amber-50 p-4 text-amber-900">{x("এই পেজ দেখার অনুমতি আপনার নেই।")}</p>; // সরাসরি লিংকে ঢুকলেও ক্র্যাশ নয়
  if (!s) return err ? <p className="rounded-lg bg-amber-50 p-4 text-amber-900">{err}</p> : <Loader compact label={x("লোড হচ্ছে...")} />;
  const info = (k, l) => <div key={k}><label className="label">{x(l)}</label><input className="input" value={isPlaceholder(s[k]) ? "" : s[k]} placeholder={hints[k] || ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>;
  const pickLogo = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    try { setErr(""); setS((p) => ({ ...p })); const url = await shrinkImage(f); setS((p) => ({ ...p, logo: url })); }
    catch { setErr(x("শুধু ছবি (JPG, PNG, WEBP) দিন")); }
  };
  const toggle = (role, p) => { const cur = s.rolePermissions[role]; setS({ ...s, rolePermissions: { ...s.rolePermissions, [role]: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p] } }); };
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl text-brand-dark">{x("সেটিংস")}</h1>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <section className="card space-y-3"><h2 className="font-bold">{x("স্কুলের তথ্য")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">{info("schoolName", "স্কুলের বাংলা নাম")}{info("schoolNameEn", "স্কুলের ইংরেজি নাম (English name)")}{info("tagline", "স্লোগান (বাংলা)")}{info("taglineEn", "Slogan (English)")}{info("address", "ঠিকানা")}{info("phone", "ফোন")}{info("email", "ইমেইল")}{info("currentSession", "চলতি শিক্ষাবর্ষ (যেমন ২০২৬)")}</div>
        <div><span className="label">{x("স্কুলের লোগো")}</span>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-slate-300 p-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-night ring-2 ring-gold/60">
              {s.logo ? <img src={s.logo} alt="" className="h-full w-full object-cover" /> : <Crest className="h-12 w-auto text-gold-soft" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-600">{x("JPG, PNG বা WEBP ছবি দিন — নিজে থেকেই বর্গাকার ও ছোট হয়ে যাবে।")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn-ghost !px-4 !py-2" onClick={() => fileRef.current?.click()}>{s.logo ? x("ছবি বদলান") : x("ছবি আপলোড করুন")}</button>
                {s.logo && <button type="button" className="btn-ghost !border-red-300 !px-4 !py-2 !text-red-700" onClick={() => setS({ ...s, logo: "" })}>{x("সরান")}</button>}
              </div>
              <p className="mt-2 text-xs text-slate-500">{x("ছবি বাছাইয়ের পর নিচের \"সংরক্ষণ\" চাপুন।")}</p>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickLogo} />
          </div></div>
        <div><label className="label">{x("পরিচিতি")}</label><textarea rows={3} className="input" value={s.about || ""} onChange={(e) => setS({ ...s, about: e.target.value })} /></div>
        <button className="btn-primary" onClick={() => save({ schoolName: s.schoolName, schoolNameEn: s.schoolNameEn || "", taglineEn: s.taglineEn || "", tagline: s.tagline, address: s.address, phone: s.phone, email: s.email, currentSession: s.currentSession, logo: s.logo, about: s.about })}>{x("সংরক্ষণ")}</button></section>

      <section className="card space-y-4"><h2 className="font-bold">{x("হোমপেজ: ভিডিও")}</h2>
        <p className="text-sm text-slate-600">{x("YouTube/Vimeo/Facebook বা সরাসরি ভিডিও ফাইলের লিংক দিন। কেউ হোমপেজে ঢুকলে ভিডিওগুলো সামনেই বামে-ডানে স্ক্রল করে দেখতে পারবে।")}</p>
        {(s.videos || []).map((v, i) => <div key={i} className="flex flex-wrap gap-2"><input className="input !w-48" placeholder={x("শিরোনাম")} value={v.title || ""} onChange={(e) => setS({ ...s, videos: s.videos.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)) })} /><input className="input min-w-0 flex-1" placeholder="https://..." value={v.url || ""} onChange={(e) => setS({ ...s, videos: s.videos.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)) })} /><button type="button" className="btn-ghost !border-red-300 !px-3 !text-red-700" onClick={() => setS({ ...s, videos: s.videos.filter((_, j) => j !== i) })}>×</button></div>)}
        <div className="flex gap-3"><button className="btn-ghost" onClick={() => setS({ ...s, videos: [...(s.videos || []), { title: "", url: "" }] })}>{x("+ ভিডিও যোগ")}</button><button className="btn-primary" onClick={() => save({ videos: s.videos || [] })}>{x("সংরক্ষণ")}</button></div></section>

      <section className="card space-y-4"><h2 className="font-bold">{x("হোমপেজ: ফোন নম্বর")}</h2>
        <p className="text-sm text-slate-600">{x("পদবী, নাম ও ফোন নম্বর যোগ করুন (যেমন: প্রধান শিক্ষক, অফিস)। এগুলো হোমপেজের ফোন নম্বর অংশে এবং পেজের নিচের \"যোগাযোগ\" অংশে দেখাবে। বাংলা বা ইংরেজি — যেকোনো অঙ্কে লিখতে পারবেন।")}</p>
        {(s.contacts || []).length > 0 && <div className="hidden gap-2 px-1 text-xs font-semibold text-slate-500 sm:grid sm:grid-cols-[auto_1fr_1fr_1fr_auto]"><span className="w-[7.5rem]">{x("ছবি (ঐচ্ছিক)")}</span><span>{x("পদবী")}</span><span>{x("নাম")}</span><span>{x("ফোন নম্বর")}</span><span className="w-10" /></div>}
        {(s.contacts || []).map((c, i) => { const set = (k, v) => setS((p) => ({ ...p, contacts: p.contacts.map((y, j) => (j === i ? { ...y, [k]: v } : y)) })); return <div key={i} className="grid items-center gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:border-0 sm:p-0"><div className="flex items-center gap-2">{c.photo ? <img src={c.photo} alt="" className="h-11 w-11 rounded-full border border-gold/50 object-cover object-top" /> : <span className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-slate-300 text-xs text-slate-400">{x("ছবি")}</span>}<label className="cursor-pointer text-xs font-semibold text-brand underline">{cBusy === i ? x("আপলোড হচ্ছে...") : c.photo ? x("বদলান") : x("ছবি দিন")}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { pickContactPhoto(i, e.target.files[0]); e.target.value = ""; }} /></label>{c.photo && <button type="button" className="text-xs text-red-600" onClick={() => set("photo", "")}>{x("সরান")}</button>}</div><input className="input min-w-0" aria-label={x("পদবী")} placeholder={x("পদবী (যেমন: প্রধান শিক্ষক)")} value={c.role || ""} onChange={(e) => set("role", e.target.value)} /><input className="input min-w-0" aria-label={x("নাম")} placeholder={x("নাম")} value={c.name || ""} onChange={(e) => set("name", e.target.value)} /><input className="input min-w-0" inputMode="tel" aria-label={x("ফোন নম্বর")} placeholder="01XXXXXXXXX" value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /><button type="button" aria-label={x("মুছুন")} className="btn-ghost !border-red-300 !px-3 !text-red-700" onClick={() => setS((p) => ({ ...p, contacts: p.contacts.filter((_, j) => j !== i) }))}>×</button></div>; })}
        {cErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{cErr}</p>}
        <div className="flex flex-wrap gap-3"><button type="button" className="btn-ghost" onClick={() => { setCErr(""); setS((p) => ({ ...p, contacts: [...(p.contacts || []), { name: "", role: "", phone: "", photo: "" }] })); }}>{x("+ নম্বর যোগ")}</button><button type="button" className="btn-primary" onClick={saveContacts}>{x("সংরক্ষণ")}</button></div></section>

      <section className="card space-y-3"><h2 className="font-bold">{x("শ্রেণি ও শাখা")}</h2><p className="text-sm text-slate-600">{x("শাখা কমা দিয়ে লিখুন (যেমন: ক, খ)। শিক্ষার্থী আছে এমন শ্রেণি মুছা যাবে না।")}</p>
        {s.classText.map((c, i) => <div key={i} className="flex gap-2"><input className="input !w-40" value={c.name} onChange={(e) => { const n = [...s.classText]; n[i] = { ...c, name: e.target.value }; setS({ ...s, classText: n }); }} /><input className="input" placeholder={x("শাখা")} value={c.sections} onChange={(e) => { const n = [...s.classText]; n[i] = { ...c, sections: e.target.value }; setS({ ...s, classText: n }); }} /><button className="px-2 text-red-600" aria-label={x("মুছুন")} onClick={() => setS({ ...s, classText: s.classText.filter((_, j) => j !== i) })}>✕</button></div>)}
        <div className="flex gap-3"><button className="btn-ghost" onClick={() => setS({ ...s, classText: [...s.classText, { name: "", sections: "" }] })}>{x("+ শ্রেণি যোগ")}</button>
          <button className="btn-primary" onClick={() => save({ classes: s.classText.map((c) => ({ name: c.name, sections: c.sections.split(/[,،]/).map((x) => x.trim()).filter(Boolean) })) })}>{x("সংরক্ষণ")}</button></div></section>

      <section className="card space-y-4"><h2 className="font-bold">{x("পেমেন্ট মাধ্যম (শিক্ষার্থীর অনলাইন পেমেন্টের জন্য)")}</h2>
        <p className="text-sm text-slate-600">{x("যে মাধ্যমগুলো \"সক্রিয়\" থাকবে শুধু সেগুলোই শিক্ষার্থী পেমেন্টের সময় দেখবে। ক্যাশ পেমেন্ট অফিসে আলাদাভাবে রেকর্ড হয়।")}</p>
        {(s.paymentMethods || []).map((m, i) => { const set = (k, v) => setS({ ...s, paymentMethods: s.paymentMethods.map((y, j) => (j === i ? { ...y, [k]: v } : y)) });
          return <div key={m.id || i} className={`space-y-3 rounded-xl border p-4 ${m.active === false ? "border-slate-200 bg-slate-50 opacity-80" : "border-gold/50"}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">{x("মাধ্যমের ধরন")}</label><select className="input" value={m.kind} onChange={(e) => set("kind", e.target.value)}>{[["bkash", "বিকাশ (bKash)"], ["nagad", "নগদ (Nagad)"], ["rocket", "রকেট (Rocket)"], ["bank", "ব্যাংক অ্যাকাউন্ট"], ["other", "অন্যান্য"]].map(([k, l]) => <option key={k} value={k}>{x(l)}</option>)}</select></div>
              <div><label className="label">{x("প্রদর্শিত নাম")}</label><input className="input" value={m.label || ""} onChange={(e) => set("label", e.target.value)} placeholder={x("যেমন: বিকাশ (পার্সোনাল)")} /></div>
              <div><label className="label">{m.kind === "bank" ? x("ব্যাংক অ্যাকাউন্ট নম্বর") : x("নম্বর / অ্যাকাউন্ট নম্বর")}</label><input className="input" value={m.accountNumber || ""} onChange={(e) => set("accountNumber", e.target.value)} /></div>
              <div><label className="label">{x("অ্যাকাউন্টের ধরন")}</label><input className="input" value={m.accountType || ""} onChange={(e) => set("accountType", e.target.value)} placeholder={m.kind === "bank" ? x("যেমন: Current / Savings") : x("যেমন: Personal / Agent / Merchant")} /></div>
              {(m.kind === "bank" || m.kind === "other") && <div className="sm:col-span-2"><label className="label">{m.kind === "bank" ? x("অ্যাকাউন্টের নাম ও ব্যাংকের শাখা") : x("অ্যাকাউন্টের নাম")}</label><input className="input" value={m.accountName || ""} onChange={(e) => set("accountName", e.target.value)} /></div>}
              <div className="sm:col-span-2"><label className="label">{x("শিক্ষার্থীর জন্য নির্দেশনা")}</label><textarea rows={2} className="input" value={m.instructions || ""} onChange={(e) => set("instructions", e.target.value)} placeholder={x("যেমন: Send Money করুন, Reference-এ আপনার আইডি লিখুন")} /></div>
            </div>
            <div className="flex items-center justify-between"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={m.active !== false} onChange={(e) => set("active", e.target.checked)} /> {x("সক্রিয় (শিক্ষার্থীরা দেখবে)")}</label><button type="button" className="text-red-600" onClick={() => setS({ ...s, paymentMethods: s.paymentMethods.filter((_, j) => j !== i) })}>{x("মুছুন")}</button></div>
          </div>; })}
        <div className="flex flex-wrap gap-2"><button type="button" className="btn-ghost" onClick={() => setS({ ...s, paymentMethods: [...(s.paymentMethods || []), { kind: "bkash", label: "", accountNumber: "", accountType: "Personal", active: true }] })}>{x("+ পেমেন্ট মাধ্যম যোগ")}</button>
          <button className="btn-primary" onClick={() => save({ paymentMethods: s.paymentMethods || [] })}>{x("পেমেন্ট মাধ্যম সংরক্ষণ")}</button></div></section>

      <section className="card space-y-3"><h2 className="font-bold">{x("প্রারম্ভিক জের (হিসাব শুরুর দিনের ব্যালেন্স)")}</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{Object.keys(methodLabel).map((k) => <div key={k}><label className="label">{x(methodLabel[k])}</label><input type="number" step="0.01" className="input" value={s.openingBalances?.[k] ?? 0} onChange={(e) => setS({ ...s, openingBalances: { ...s.openingBalances, [k]: e.target.value } })} /></div>)}</div>
        <button className="btn-primary" onClick={() => save({ openingBalances: s.openingBalances })}>{x("সংরক্ষণ")}</button></section>

      <section className="card space-y-3"><h2 className="font-bold">{x("শিক্ষকের অ্যাক্সেস")}</h2><label className="flex items-center gap-3"><input type="checkbox" checked={s.restrictTeachers !== false} onChange={(e) => setS({ ...s, restrictTeachers: e.target.checked })} /> {x("শিক্ষক শুধু নিজের নিয়োগকৃত শ্রেণি/বিষয়ে কাজ করতে পারবেন (প্রস্তাবিত)")}</label><button className="btn-primary" onClick={() => save({ restrictTeachers: s.restrictTeachers !== false })}>{x("সংরক্ষণ")}</button></section>

      <section className="card space-y-3"><h2 className="font-bold">{x("রোল ও অনুমতি")}</h2><p className="text-sm text-slate-600">{x("সুপার অ্যাডমিন সবসময় সব অনুমতি পায়। পরিবর্তন সাথে সাথে কার্যকর হয় (সার্ভারে যাচাই হয়)।")}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr><th className="th">{x("অনুমতি")}</th>{Object.keys(s.rolePermissions).map((r) => <th key={r} className="th text-center">{x(roleLabel[r])}</th>)}</tr></thead>
          <tbody>{Object.entries(s.permissionList).map(([p, l]) => <tr key={p}><td className="td">{x(l)}</td>{Object.keys(s.rolePermissions).map((r) => <td key={r} className="td text-center"><input type="checkbox" aria-label={`${x(roleLabel[r])} — ${x(l)}`} checked={s.rolePermissions[r].includes(p)} onChange={() => toggle(r, p)} /></td>)}</tr>)}</tbody></table></div>
        <button className="btn-primary" onClick={() => save({ rolePermissions: s.rolePermissions })}>{x("অনুমতি সংরক্ষণ")}</button></section>
      <Toast msg={toast} />
    </div>
  );
}
