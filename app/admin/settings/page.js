"use client";
import { useEffect, useState } from "react";
import { api, Toast } from "@/components/CrudPage";
import { roleLabel } from "@/lib/rbac";
import { methodLabel } from "@/lib/school";

export default function SettingsPage() {
  const [s, setS] = useState(null); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const load = () => api("GET", "/api/settings").then((r) => (r.ok ? setS({ ...r.d, classText: r.d.classes.map((c) => ({ name: c.name, sections: (c.sections || []).join(", ") })) }) : setErr(r.d.error || "লোড করা যায়নি")));
  useEffect(() => { load(); }, []);
  const save = async (body, ok = "✅ সংরক্ষিত") => { setErr(""); const r = await api("PUT", "/api/settings", body); if (!r.ok) return setErr(r.d.error || "সংরক্ষণ ব্যর্থ"); setToast(ok); setTimeout(() => setToast(""), 2500); load(); };
  if (err && !s) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!s) return <p>লোড হচ্ছে...</p>;
  const info = (k, l) => <div key={k}><label className="label">{l}</label><input className="input" value={s[k] || ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>;
  const toggle = (role, p) => { const cur = s.rolePermissions[role]; setS({ ...s, rolePermissions: { ...s.rolePermissions, [role]: cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p] } }); };
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">সেটিংস</h1>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <section className="card space-y-3"><h2 className="font-bold">স্কুলের তথ্য</h2>
        <div className="grid gap-3 sm:grid-cols-2">{info("schoolName", "স্কুলের নাম")}{info("tagline", "স্লোগান")}{info("address", "ঠিকানা")}{info("phone", "ফোন")}{info("email", "ইমেইল")}{info("currentSession", "চলতি শিক্ষাবর্ষ (যেমন ২০২৬)")}{info("logo", "লোগো URL (আপলোডকৃত ছবির লিংক)")}</div>
        <div><label className="label">পরিচিতি</label><textarea rows={3} className="input" value={s.about || ""} onChange={(e) => setS({ ...s, about: e.target.value })} /></div>
        <button className="btn-primary" onClick={() => save({ schoolName: s.schoolName, tagline: s.tagline, address: s.address, phone: s.phone, email: s.email, currentSession: s.currentSession, logo: s.logo, about: s.about })}>সংরক্ষণ</button></section>

      <section className="card space-y-3"><h2 className="font-bold">শ্রেণি ও শাখা</h2><p className="text-sm text-slate-600">শাখা কমা দিয়ে লিখুন (যেমন: ক, খ)। শিক্ষার্থী আছে এমন শ্রেণি মুছা যাবে না।</p>
        {s.classText.map((c, i) => <div key={i} className="flex gap-2"><input className="input !w-40" value={c.name} onChange={(e) => { const n = [...s.classText]; n[i] = { ...c, name: e.target.value }; setS({ ...s, classText: n }); }} /><input className="input" placeholder="শাখা" value={c.sections} onChange={(e) => { const n = [...s.classText]; n[i] = { ...c, sections: e.target.value }; setS({ ...s, classText: n }); }} /><button className="px-2 text-red-600" aria-label="মুছুন" onClick={() => setS({ ...s, classText: s.classText.filter((_, j) => j !== i) })}>✕</button></div>)}
        <div className="flex gap-3"><button className="btn-ghost" onClick={() => setS({ ...s, classText: [...s.classText, { name: "", sections: "" }] })}>+ শ্রেণি যোগ</button>
          <button className="btn-primary" onClick={() => save({ classes: s.classText.map((c) => ({ name: c.name, sections: c.sections.split(/[,،]/).map((x) => x.trim()).filter(Boolean) })) })}>সংরক্ষণ</button></div></section>

      <section className="card space-y-3"><h2 className="font-bold">প্রারম্ভিক জের (হিসাব শুরুর দিনের ব্যালেন্স)</h2>
        <div className="grid gap-3 sm:grid-cols-4">{Object.keys(methodLabel).map((k) => <div key={k}><label className="label">{methodLabel[k]}</label><input type="number" step="0.01" className="input" value={s.openingBalances?.[k] ?? 0} onChange={(e) => setS({ ...s, openingBalances: { ...s.openingBalances, [k]: e.target.value } })} /></div>)}</div>
        <button className="btn-primary" onClick={() => save({ openingBalances: s.openingBalances })}>সংরক্ষণ</button></section>

      <section className="card space-y-3"><h2 className="font-bold">শিক্ষকের অ্যাক্সেস</h2><label className="flex items-center gap-3"><input type="checkbox" checked={s.restrictTeachers !== false} onChange={(e) => setS({ ...s, restrictTeachers: e.target.checked })} /> শিক্ষক শুধু নিজের নিয়োগকৃত শ্রেণি/বিষয়ে কাজ করতে পারবেন (প্রস্তাবিত)</label><button className="btn-primary" onClick={() => save({ restrictTeachers: s.restrictTeachers !== false })}>সংরক্ষণ</button></section>

      <section className="card space-y-3"><h2 className="font-bold">রোল ও অনুমতি</h2><p className="text-sm text-slate-600">সুপার অ্যাডমিন সবসময় সব অনুমতি পায়। পরিবর্তন সাথে সাথে কার্যকর হয় (সার্ভারে যাচাই হয়)।</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr><th className="th">অনুমতি</th>{Object.keys(s.rolePermissions).map((r) => <th key={r} className="th text-center">{roleLabel[r]}</th>)}</tr></thead>
          <tbody>{Object.entries(s.permissionList).map(([p, l]) => <tr key={p}><td className="td">{l}</td>{Object.keys(s.rolePermissions).map((r) => <td key={r} className="td text-center"><input type="checkbox" aria-label={`${roleLabel[r]} — ${l}`} checked={s.rolePermissions[r].includes(p)} onChange={() => toggle(r, p)} /></td>)}</tr>)}</tbody></table></div>
        <button className="btn-primary" onClick={() => save({ rolePermissions: s.rolePermissions })}>অনুমতি সংরক্ষণ</button></section>
      <Toast msg={toast} />
    </div>
  );
}
