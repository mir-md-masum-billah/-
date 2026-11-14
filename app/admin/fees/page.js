"use client";
import { useEffect, useState, useCallback } from "react";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import Modal from "@/components/Modal";
import { api, Pager, Toast } from "@/components/CrudPage";
import { money, months, feeCats, methodLabel } from "@/lib/school";
import { todayDhaka, yearDhaka, monthDhaka } from "@/lib/dates";

const F = ({ l, children }) => <div><label className="label">{l}</label>{children}</div>;

export default function Fees() {
  const st = useSettings(); const me = useMe();
  const [tab, setTab] = useState("inv");
  const [d, setD] = useState({ items: [], total: 0, pages: 1, totals: {} }); const [page, setPage] = useState(1);
  const [f, setF] = useState({ class: "", month: "", year: String(yearDhaka()), outstanding: true, q: "" }); const [dq, setDq] = useState("");
  const [loading, setLoading] = useState(true); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const [students, setStudents] = useState([]);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { const t = setTimeout(() => setDq(f.q), 350); return () => clearTimeout(t); }, [f.q]);
  useEffect(() => { setPage(1); }, [f.class, f.month, f.year, f.outstanding, dq, tab]);
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    const url = tab === "inv"
      ? `/api/invoices?page=${page}&limit=20&q=${encodeURIComponent(dq)}${f.class ? "&class=" + encodeURIComponent(f.class) : ""}${f.month ? "&month=" + f.month : ""}${f.year ? "&year=" + f.year : ""}${f.outstanding ? "&outstanding=true" : ""}`
      : `/api/payments?page=${page}&limit=20`;
    const r = await api("GET", url);
    if (r.ok) setD(r.d); else setErr(r.d.error || "লোড করা যায়নি");
    setLoading(false);
  }, [tab, page, dq, f.class, f.month, f.year, f.outstanding]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api("GET", "/api/students?limit=1000&active=true").then((r) => r.ok && setStudents(r.d.items)); }, []);

  if (!st || !me) return <p>লোড হচ্ছে...</p>;
  const can = (p) => me.perms.includes(p);
  const open = (type, init = {}) => { setMErr(""); setForm(init); setModal(type); };
  async function submit(e, method, url, body, okMsg, after) {
    e.preventDefault(); setBusy(true); setMErr("");
    const r = await api(method, url, body); setBusy(false);
    if (!r.ok) return setMErr(r.d.error || "সমস্যা হয়েছে");
    setModal(null); flash(okMsg(r.d)); after?.(r.d); load();
  }
  const ask = async (msg, method, url, ok) => { const reason = prompt(msg); if (!reason) return; const r = await api(method, url, { reason }); if (!r.ok) return flash(r.d.error || "সমস্যা হয়েছে"); flash(ok); load(); };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">বেতন ও ফি</h1>
        {can("fees.manage") && <><button className="btn-ghost" onClick={() => open("gen", { month: monthDhaka(), year: yearDhaka(), class: "" })}>মাসিক ফি তৈরি</button><button className="btn-primary" onClick={() => open("new", { category: "tuition", period: todayDhaka().slice(0, 7) })}>+ ইনভয়েস</button></>}
      </div>
      <div className="mb-4 flex gap-2 border-b">{[["inv", "ইনভয়েস ও বকেয়া"], ["pay", "পেমেন্ট ইতিহাস"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 font-semibold ${tab === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{l}</button>)}</div>

      {tab === "inv" && <>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={f.class} onChange={(e) => setF({ ...f, class: e.target.value })} aria-label="শ্রেণি"><option value="">সব শ্রেণি</option>{st.classes.map((c) => <option key={c.name}>{c.name}</option>)}</select>
          <select className="input !w-auto" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} aria-label="মাস"><option value="">সব মাস</option>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
          <input className="input !w-24" type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} aria-label="বছর" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.outstanding} onChange={(e) => setF({ ...f, outstanding: e.target.checked })} /> শুধু বকেয়া</label>
          <input className="input !w-48" placeholder="নাম/আইডি/ইনভয়েস নং" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        </div>
        {d.totals && <p className="mb-3 text-sm text-slate-700">ফিল্টারে মোট ধার্য <b>{money(d.totals.obligation)}</b> · জমা <b className="text-brand">{money(d.totals.paid)}</b> · বকেয়া <b className="text-red-600">{money(d.totals.due)}</b></p>}
      </>}
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err} <button className="underline" onClick={load}>আবার চেষ্টা</button></p>}

      <div className={`card overflow-x-auto !p-0 ${loading ? "opacity-60" : ""}`}>
        {tab === "inv" ? (
          <table className="w-full min-w-[760px]"><thead><tr>{["ইনভয়েস", "শিক্ষার্থী", "বিবরণ", "ধার্য", "জমা", "বকেয়া", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{d.items.map((i) => (
              <tr key={i._id}><td className="td whitespace-nowrap">{i.invoiceNo}</td><td className="td">{i.student.name} <span className="text-xs text-slate-500">({i.student.class}-{i.student.roll})</span></td>
                <td className="td">{i.title}{i.period && ` — ${months[i.month - 1]} ${i.year}`}{i.discount ? <span className="block text-xs text-slate-500">ছাড় {money(i.discount)}</span> : null}</td>
                <td className="td">{money(i.obligation)}</td><td className="td">{money(i.paid)}</td>
                <td className={`td font-bold ${i.due > 0 ? "text-red-600" : "text-brand"}`}>{i.due > 0 ? money(i.due) : i.due < 0 ? "অগ্রিম " + money(-i.due) : "পরিশোধিত"}</td>
                <td className="td whitespace-nowrap text-right">
                  {can("fees.collect") && i.due > 0 && <button className="mr-2 font-semibold text-brand" onClick={() => open("pay", { invoice: i._id, label: `${i.student.name} — ${i.title}`, due: i.due, amount: i.due, method: "cash", date: todayDhaka() })}>পেমেন্ট</button>}
                  {can("fees.manage") && <>
                    <button className="mr-2 font-semibold text-slate-700" onClick={() => open("adj", { id: i._id, label: `${i.student.name} — ${i.title}`, amount: i.amount, discount: i.discount, fine: i.fine, discountReason: i.discountReason || "" })}>সমন্বয়</button>
                    {i.paid > 0 && <button className="mr-2 font-semibold text-amber-700" onClick={() => open("refund", { invoice: i._id, label: `${i.student.name} — ${i.title}`, max: i.paid, method: "cash", date: todayDhaka() })}>রিফান্ড</button>}
                    {i.paid === 0 && <button className="font-semibold text-red-600" onClick={() => ask("ইনভয়েস বাতিলের কারণ:", "DELETE", `/api/invoices/${i._id}`, "ইনভয়েস বাতিল হয়েছে")}>বাতিল</button>}
                  </>}
                </td></tr>))}
              {!loading && d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>কোনো ইনভয়েস নেই। "মাসিক ফি তৈরি" দিয়ে শুরু করুন।</td></tr>}</tbody></table>
        ) : (
          <table className="w-full min-w-[760px]"><thead><tr>{["রসিদ", "তারিখ", "শিক্ষার্থী", "বিবরণ", "পদ্ধতি", "টাকা", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>{d.items.map((p) => (
              <tr key={p._id}><td className="td whitespace-nowrap">{p.receiptNo}</td><td className="td">{p.date}</td><td className="td">{p.student?.name}</td><td className="td">{p.invoice?.title}{p.type === "refund" && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-800">রিফান্ড</span>}</td>
                <td className="td">{methodLabel[p.method]}</td><td className={`td font-bold ${p.type === "refund" ? "text-red-600" : "text-brand"}`}>{p.type === "refund" ? "−" : ""}{money(p.amount)}</td>
                <td className="td whitespace-nowrap text-right"><a className="mr-3 font-semibold text-brand" href={`/admin/receipt/${p._id}`} target="_blank">রসিদ</a>{can("fees.manage") && <button className="font-semibold text-red-600" onClick={() => ask("এই লেনদেন বাতিলের কারণ:", "POST", `/api/payments/${p._id}/void`, "লেনদেন বাতিল হয়েছে")}>বাতিল</button>}</td></tr>))}
              {!loading && d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>কোনো পেমেন্ট নেই</td></tr>}</tbody></table>
        )}
      </div>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />

      {modal === "pay" && <Modal title="পেমেন্ট নিন" onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/payments", { invoice: form.invoice, amount: form.amount, method: form.method, date: form.date, reference: form.reference, note: form.note }, (d) => `✅ রসিদ ${d.receiptNo}`, (d) => window.open(`/admin/receipt/${d.id}`, "_blank"))}>
        <p className="font-semibold">{form.label}</p><p className="text-sm text-slate-600">বকেয়া: {money(form.due)}</p>
        <F l="টাকা"><input type="number" step="0.01" min="0.01" max={form.due} required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l="পদ্ধতি"><select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></F>
        <F l="তারিখ"><input type="date" required max={todayDhaka()} className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
        <F l="ট্রানজেকশন আইডি/রেফারেন্স"><input className="input" onChange={(e) => setForm({ ...form, reference: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? "অপেক্ষা করুন..." : "পেমেন্ট নিশ্চিত করুন"}</button></form></Modal>}

      {modal === "refund" && <Modal title="রিফান্ড" onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/payments", { type: "refund", invoice: form.invoice, amount: form.amount, method: form.method, date: form.date, note: form.note }, (d) => `✅ রিফান্ড ${d.receiptNo}`)}>
        <p className="font-semibold">{form.label}</p><p className="text-sm text-slate-600">ফেরতযোগ্য: {money(form.max)}</p>
        <F l="টাকা"><input type="number" step="0.01" min="0.01" max={form.max} required className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l="পদ্ধতি"><select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></F>
        <F l="কারণ (আবশ্যক)"><input required minLength={3} className="input" onChange={(e) => setForm({ ...form, note: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-danger w-full" disabled={busy}>রিফান্ড করুন</button></form></Modal>}

      {modal === "adj" && <Modal title="ডিসকাউন্ট/জরিমানা সমন্বয়" onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "PUT", `/api/invoices/${form.id}`, { amount: form.amount, discount: form.discount || 0, fine: form.fine || 0, discountReason: form.discountReason }, () => "✅ সমন্বয় হয়েছে")}>
        <p className="font-semibold">{form.label}</p>
        <F l="ধার্য টাকা"><input type="number" min="0.01" step="0.01" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l="ডিসকাউন্ট/স্কলারশিপ/মওকুফ"><input type="number" min="0" step="0.01" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></F>
        <F l="কারণ"><input className="input" value={form.discountReason} onChange={(e) => setForm({ ...form, discountReason: e.target.value })} /></F>
        <F l="জরিমানা"><input type="number" min="0" step="0.01" className="input" value={form.fine} onChange={(e) => setForm({ ...form, fine: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>সংরক্ষণ</button></form></Modal>}

      {modal === "gen" && <Modal title="মাসিক ফি তৈরি" onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/invoices/generate", form, (d) => `✅ নতুন ${d.created} টি, আগে ছিল ${d.alreadyExisted} টি${d.skippedNoFee ? `, বেতন ০ তাই বাদ ${d.skippedNoFee} জন` : ""}`)}>
        <F l="শ্রেণি"><select className="input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}><option value="">সব শ্রেণি</option>{st.classes.map((c) => <option key={c.name}>{c.name}</option>)}</select></F>
        <F l="মাস"><select className="input" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></F>
        <F l="বছর"><input type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></F>
        <F l="সবার জন্য একই টাকা (ফাঁকা = প্রত্যেকের নিজের মাসিক বেতন)"><input type="number" min="0.01" className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? "তৈরি হচ্ছে..." : "ইনভয়েস তৈরি করুন"}</button></form></Modal>}

      {modal === "new" && <Modal title="নতুন ইনভয়েস" onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/invoices", form, (d) => `✅ ${d.invoiceNo}`)}>
        <F l="শিক্ষার্থী"><select required className="input" onChange={(e) => setForm({ ...form, student: e.target.value })}><option value="">— বাছাই করুন —</option>{students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.class}-{s.roll})</option>)}</select></F>
        <F l="ধরন"><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(feeCats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></F>
        <F l="বিবরণ (ফাঁকা = ধরনের নাম)"><input className="input" onChange={(e) => setForm({ ...form, title: e.target.value })} /></F>
        <F l="মাস (মাসিক বেতনে আবশ্যক)"><input type="month" className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></F>
        <F l="টাকা"><input type="number" min="0.01" step="0.01" required className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>তৈরি করুন</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
