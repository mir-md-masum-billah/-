"use client";
import { useEffect, useState, useCallback } from "react";

export async function api(method, url, body) {
  try {
    const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { location.href = "/login"; return { ok: false, d }; }
    return { ok: r.ok, status: r.status, d };
  } catch { return { ok: false, d: { error: "নেটওয়ার্ক সমস্যা — ইন্টারনেট যাচাই করুন" } }; }
}

export function Pager({ page, pages, total, setPage }) {
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
      <span>মোট {total.toLocaleString("bn-BD")} টি</span>
      <div className="flex items-center gap-2">
        <button className="btn-ghost !py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>← আগের</button>
        <span>{page.toLocaleString("bn-BD")} / {pages.toLocaleString("bn-BD")}</span>
        <button className="btn-ghost !py-1.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>পরের →</button>
      </div>
    </div>
  );
}
export function Toast({ msg }) { return msg ? <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-white shadow-lg">{msg}</div> : null; }

// ব্যবহার: <CrudPage resource title columns fields defaults query canWrite deleteLabel />
export default function CrudPage({ resource, title, columns, fields, defaults = {}, query = "", addLabel = "নতুন যোগ করুন", canWrite = true, rowActions, deleteLabel = "মুছুন", deleteConfirm = "সত্যিই মুছে ফেলবেন?", toolbar }) {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const [loading, setLoading] = useState(true); const [loadErr, setLoadErr] = useState("");
  const [refs, setRefs] = useState({});
  const [creds, setCreds] = useState(null); const [form, setForm] = useState(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [toast, setToast] = useState("");

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true); setLoadErr("");
    const r = await api("GET", `/api/${resource}?page=${page}&limit=20&q=${encodeURIComponent(dq)}${query}`);
    if (r.ok) setData(r.d); else setLoadErr(r.d.error || "তথ্য আনা যায়নি");
    setLoading(false);
  }, [resource, page, dq, query]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fields.filter((f) => f.ref).forEach(async (f) => { const r = await api("GET", `/api/${f.ref}?limit=1000${f.refQuery ?? "&active=true"}`); if (r.ok) setRefs((p) => ({ ...p, [f.ref]: r.d.items })); });
  }, []); // eslint-disable-line

  const openNew = () => { setErr(""); setForm({ ...defaults }); };
  const openEdit = (row) => { setErr(""); const f = { ...row, password: "" }; fields.filter((x) => x.ref).forEach((x) => (f[x.key] = row[x.key]?._id || row[x.key])); setForm(f); };

  async function save(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const isEdit = !!form._id;
    const r = await api(isEdit ? "PUT" : "POST", isEdit ? `/api/${resource}/${form._id}` : `/api/${resource}`, form);
    setBusy(false);
    if (!r.ok) return setErr(r.d.error || "সমস্যা হয়েছে");
    setForm(null); load();
    if (r.d.generatedPassword) { setCreds({ id: r.d.studentId, pw: r.d.generatedPassword }); } else flash("✅ সংরক্ষিত হয়েছে");
  }
  async function remove(row) {
    if (!confirm(deleteConfirm)) return;
    const r = await api("DELETE", `/api/${resource}/${row._id}`);
    if (!r.ok) return flash(r.d.error || "সমস্যা হয়েছে");
    flash("✅ সম্পন্ন"); load();
  }
  async function upload(key, file) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file); setBusy(true); setErr("");
    try { const r = await fetch("/api/upload", { method: "POST", body: fd }); const d = await r.json(); if (!r.ok) setErr(d.error); else setForm((f) => ({ ...f, [key]: d.url })); }
    catch { setErr("আপলোড ব্যর্থ — নেটওয়ার্ক সমস্যা"); }
    setBusy(false);
  }
  const opts = (f) => (typeof f.options === "function" ? f.options(form) : f.options) || [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">{title}</h1>
        {toolbar}
        <input className="input !w-44 sm:!w-60" placeholder="খুঁজুন..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="খুঁজুন" />
        {canWrite && <button className="btn-primary" onClick={openNew}>+ {addLabel}</button>}
      </div>
      {loadErr && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{loadErr} <button className="underline" onClick={load}>আবার চেষ্টা</button></p>}
      <div className={`card overflow-x-auto !p-0 ${loading ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[560px]">
          <thead><tr>{columns.map((c) => <th key={c.label} className="th">{c.label}</th>)}{canWrite && <th className="th" />}</tr></thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                {columns.map((c) => <td key={c.label} className="td">{c.render ? c.render(r) : (r[c.key] ?? "—")}</td>)}
                {canWrite && <td className="td whitespace-nowrap text-right">
                  {rowActions?.(r)}<button className="mr-3 font-semibold text-brand" onClick={() => openEdit(r)}>এডিট</button>
                  <button className="font-semibold text-red-600" onClick={() => remove(r)}>{deleteLabel}</button>
                </td>}
              </tr>
            ))}
            {!loading && data.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={columns.length + 1}>{dq ? "খুঁজে পাওয়া যায়নি" : "এখনো কোনো তথ্য নেই — উপরের বাটনে চাপ দিয়ে যোগ করুন"}</td></tr>}
            {loading && data.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={columns.length + 1}>লোড হচ্ছে...</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} pages={data.pages} total={data.total} setPage={setPage} />

      {form && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setForm(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" role="dialog" aria-modal="true">
            <h2 className="mb-4 text-xl font-bold">{form._id ? "তথ্য সম্পাদনা" : addLabel}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" || f.full ? "sm:col-span-2" : ""}>
                  <label className="label">{f.label}{f.required && <span className="text-red-600"> *</span>}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={4} className="input" value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  ) : f.type === "select" ? (
                    <select className="input" required={f.required} value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value, ...(f.resets || {}) })}>
                      <option value="">— বাছাই করুন —</option>
                      {opts(f).map((o) => <option key={String(o.value ?? o)} value={String(o.value ?? o)}>{o.label ?? o}</option>)}
                    </select>
                  ) : f.ref ? (
                    <select className="input" required={f.required} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      <option value="">— বাছাই করুন —</option>
                      {(refs[f.ref] || []).map((o) => <option key={o._id} value={o._id}>{f.refLabel ? f.refLabel(o) : `${o.name} (${o.class}-${o.roll})`}</option>)}
                    </select>
                  ) : f.type === "file" ? (
                    <div><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => upload(f.key, e.target.files[0])} className="text-sm" />
                      {form[f.key] && <a href={form[f.key]} target="_blank" className="mt-1 block text-sm text-brand">আপলোড করা ফাইল দেখুন</a>}</div>
                  ) : (
                    <input className="input" type={f.type || "text"} required={f.required && !(f.type === "password" && form._id)} min={f.min} step={f.step}
                      placeholder={f.type === "password" && form._id ? "বদলাতে চাইলে নতুন পাসওয়ার্ড লিখুন" : ""} value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            {err && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>বাতিল</button>
              <button className="btn-primary" disabled={busy}>{busy ? "অপেক্ষা করুন..." : "সংরক্ষণ করুন"}</button>
            </div>
          </form>
        </div>
      )}
      {creds && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-5" role="alertdialog">
          <h2 className="mb-2 text-xl font-bold">✅ ভর্তি সম্পন্ন</h2><p className="mb-3 text-sm text-slate-600">লগইন তথ্য এখনই লিখে বা কপি করে রাখুন — পাসওয়ার্ড আর দেখানো হবে না।</p>
          <p className="rounded-lg bg-slate-100 p-3 text-lg">আইডি: <b>{creds.id}</b><br />পাসওয়ার্ড: <b>{creds.pw}</b></p>
          <button className="btn-primary mt-4 w-full" onClick={() => setCreds(null)}>লিখে রেখেছি</button></div></div>
      )}
      <Toast msg={toast} />
    </div>
  );
}
