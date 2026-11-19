"use client";
import { useEffect, useState, useCallback } from "react";
import { api, Toast } from "./CrudPage";
import Modal from "./Modal";
import Loader from "./Loader";
import Icon from "./Icon";
import { useLang } from "./LangProvider";
import { confirmBox } from "./Dialog";

// বইয়ের ছবি: R2 কনফিগার থাকলে সেখানে আপলোড; না থাকলে (503) ব্রাউজারে ছোট করে সরাসরি সংরক্ষণ
async function shrink(file) {
  const bmp = await createImageBitmap(file); const k = Math.min(1, 360 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  let out = c.toDataURL("image/webp", 0.82); if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", 0.82); return out;
}
async function uploadImage(file) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error("শুধু JPG, PNG বা WEBP ছবি দিন");
  const fd = new FormData(); fd.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: fd });
  if (r.ok) return (await r.json()).url;
  if (r.status === 503) return shrink(file);
  throw new Error((await r.json().catch(() => ({}))).error || "আপলোড ব্যর্থ");
}

// all = "বিষয়" ট্যাব: সব শ্রেণির সব বিষয় একসাথে; যোগ/সম্পাদনার ফর্ম একই (শ্রেণি টিক দিয়ে, বইয়ের ছবিসহ)
export default function ClassSubjects({ classes, canWrite, all = false }) {
  const { x } = useLang();
  const [cls, setCls] = useState(classes[0]?.name || ""); const [items, setItems] = useState(null); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const [form, setForm] = useState(null); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const load = useCallback(async () => { if (!cls) return; setItems(null); const r = await api("GET", "/api/subjects?limit=1000"); r.ok ? setItems(all ? r.d.items : r.d.items.filter((s) => !s.classes?.length || s.classes.includes(cls))) : setErr(r.d.error || x("লোড করা যায়নি")); }, [cls]);
  useEffect(() => { load(); }, [load]);
  const pick = async (f) => { if (!f) return; setBusy(true); setMErr(""); try { setForm((p) => ({ ...p, image: "" })); const url = await uploadImage(f); setForm((p) => ({ ...p, image: url })); } catch (e) { setMErr(x(e.message)); } setBusy(false); };
  async function save(e) {
    e.preventDefault(); setBusy(true); setMErr("");
    const body = { name: form.name, code: form.code, type: form.type, fullMarks: form.fullMarks, classes: form.classes, image: form.image || "" };
    const r = form._id ? await api("PUT", `/api/subjects/${form._id}`, body) : await api("POST", "/api/subjects", body);
    setBusy(false); if (!r.ok) return setMErr(r.d.error || x("সমস্যা হয়েছে")); setForm(null); flash(x("✅ সংরক্ষিত")); load();
  }
  async function del(s) { if (!(await confirmBox(x("\"{0}\" বিষয়টি মুছবেন?", s.name), { danger: true }))) return; const r = await api("DELETE", `/api/subjects/${s._id}`); flash(r.ok ? x("✅ মোছা হয়েছে") : "⚠ " + r.d.error); load(); }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">{!all && <><label className="font-semibold">{x("শ্রেণি")}</label><select className="input !w-auto" value={cls} onChange={(e) => setCls(e.target.value)}>{classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select></>}
        {canWrite && <button className="btn-primary ml-auto" onClick={() => { setMErr(""); setForm({ name: "", code: "", type: "compulsory", fullMarks: 100, classes: all ? [] : [cls], image: "" }); }}>{x("+ বিষয় যোগ")}</button>}</div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {!items ? <Loader compact label={x("লোড হচ্ছে...")} /> : items.length === 0 ? <p className="card text-center text-slate-500">{x("এই শ্রেণির কোনো বিষয় যোগ করা হয়নি")}</p> :
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map((s) => <div key={s._id} className="card flex flex-col !p-3">
          <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-lg border border-gold/40 bg-brand-light/50">{s.image ? <img src={s.image} alt={s.name} className="h-full w-full object-cover" /> : <Icon name="book" className="h-12 w-12 text-gold-deep/60" />}</div>
          <p className="mt-2 font-bold text-brand-dark">{x(s.name)}</p><p className="text-xs text-slate-500">{s.type === "optional" ? x("ঐচ্ছিক") : x("বাধ্যতামূলক")} · {x("পূর্ণমান")} {s.fullMarks}{!s.classes?.length && ` · ${x("সব শ্রেণি")}`}</p>{all && s.classes?.length > 0 && <p className="text-xs text-slate-500">{s.classes.map((c) => x(c)).join(", ")}</p>}
          {canWrite && <div className="mt-2 flex gap-3 text-sm"><button className="font-semibold text-slate-700" onClick={() => { setMErr(""); setForm({ ...s, classes: s.classes?.length ? s.classes : classes.map((c) => c.name) }); }}>{x("সম্পাদনা")}</button><button className="font-semibold text-red-600" onClick={() => del(s)}>{x("মুছুন")}</button></div>}</div>)}</div>}
      {form && <Modal title={form._id ? x("বিষয় সম্পাদনা") : x("নতুন বিষয়")} onClose={() => setForm(null)}><form className="space-y-3" onSubmit={save}>
        <div><label className="label">{x("বিষয়ের নাম")}</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3"><div><label className="label">{x("কোড")}</label><input className="input" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="label">{x("ধরন")}</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="compulsory">{x("বাধ্যতামূলক")}</option><option value="optional">{x("ঐচ্ছিক")}</option></select></div>
          <div><label className="label">{x("পূর্ণমান")}</label><input type="number" min="1" className="input" value={form.fullMarks} onChange={(e) => setForm({ ...form, fullMarks: e.target.value })} /></div></div>
        <div><label className="label">{x("যে শ্রেণিগুলোতে এই বিষয়")}</label><label className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><input type="checkbox" checked={form.classes.length === classes.length} onChange={(e) => setForm({ ...form, classes: e.target.checked ? classes.map((c) => c.name) : [] })} /> {x("সব শ্রেণি")}</label><div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-slate-200 p-2">{classes.map((c) => <label key={c.name} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={form.classes.includes(c.name)} onChange={(e) => setForm({ ...form, classes: e.target.checked ? [...form.classes, c.name] : form.classes.filter((k) => k !== c.name) })} /> {x(c.name)}</label>)}</div></div>
        <div><label className="label">{x("বইয়ের ছবি")}</label><div className="flex items-center gap-4"><div className="grid h-28 w-20 shrink-0 place-items-center overflow-hidden rounded border border-gold/40 bg-brand-light/50">{form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : <Icon name="book" className="h-8 w-8 text-gold-deep/60" />}</div>
          <div><input type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" onChange={(e) => pick(e.target.files?.[0])} />{form.image && <button type="button" className="mt-1 block text-sm text-red-600" onClick={() => setForm({ ...form, image: "" })}>{x("ছবি সরান")}</button>}</div></div></div>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : x("সংরক্ষণ")}</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
