"use client";
import { useEffect, useState, useCallback } from "react";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import { printUrl } from "@/lib/print";
import Modal from "@/components/Modal";
import { api, Pager, Toast } from "@/components/CrudPage";
import { months, feeCats, methodLabel } from "@/lib/school";
import { useLang } from "@/components/LangProvider";
import { todayDhaka, yearDhaka, monthDhaka } from "@/lib/dates";
import Loader from "@/components/Loader";
import { promptBox } from "@/components/Dialog";

const F = ({ l, children }) => <div><label className="label">{l}</label>{children}</div>;

export default function Fees() {
  const { x, n, money, date } = useLang();
  const st = useSettings(); const me = useMe();
  const [tab, setTab] = useState("inv");
  const [d, setD] = useState({ items: [], total: 0, pages: 1, totals: {} }); const [page, setPage] = useState(1);
  const [f, setF] = useState({ class: "", month: "", year: String(yearDhaka()), outstanding: true, q: "" }); const [dq, setDq] = useState("");
  const [loading, setLoading] = useState(true); const [err, setErr] = useState(""); const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const [students, setStudents] = useState([]); const [chan, setChan] = useState(""); const [cashInv, setCashInv] = useState([]);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { const t = setTimeout(() => setDq(f.q), 350); return () => clearTimeout(t); }, [f.q]);
  useEffect(() => { setPage(1); }, [f.class, f.month, f.year, f.outstanding, dq, tab, chan]);
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    const url = tab === "inv"
      ? `/api/invoices?page=${page}&limit=20&q=${encodeURIComponent(dq)}${f.class ? "&class=" + encodeURIComponent(f.class) : ""}${f.month ? "&month=" + f.month : ""}${f.year ? "&year=" + f.year : ""}${f.outstanding ? "&outstanding=true" : ""}`
      : `/api/payments?page=${page}&limit=20${chan ? "&channel=" + chan : ""}`;
    const r = await api("GET", url);
    if (r.ok) setD(r.d); else setErr(r.d.error || x("লোড করা যায়নি"));
    setLoading(false);
  }, [tab, page, dq, f.class, f.month, f.year, f.outstanding, chan]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api("GET", "/api/students?limit=1000&active=true").then((r) => r.ok && setStudents(r.d.items)); }, []);

  if (!st || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const can = (p) => me.perms.includes(p);
  const open = (type, init = {}) => { setMErr(""); setForm(init); setModal(type); };
  async function submit(e, method, url, body, okMsg, after) {
    e.preventDefault(); setBusy(true); setMErr("");
    const r = await api(method, url, body); setBusy(false);
    if (!r.ok) return setMErr(r.d.error || x("সমস্যা হয়েছে"));
    setModal(null); flash(okMsg(r.d)); after?.(r.d); load();
  }
  const ask = async (msg, method, url, ok) => { const reason = await promptBox(msg, { danger: true }); if (!reason) return; const r = await api(method, url, { reason }); if (!r.ok) return flash(r.d.error || x("সমস্যা হয়েছে")); flash(ok); load(); };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl text-brand-dark">{x("বেতন ও ফি")}</h1>
        {can("fees.collect") && <button className="btn-gold" onClick={() => open("cash", { student: "", invoice: "", category: "tuition", period: todayDhaka().slice(0, 7), amount: "", date: todayDhaka() })}>{x("ক্যাশ পেমেন্ট")}</button>}
        {can("fees.manage") && <><button className="btn-ghost" onClick={() => open("gen", { month: monthDhaka(), year: yearDhaka(), class: "" })}>{x("মাসিক ফি তৈরি")}</button><button className="btn-primary" onClick={() => open("new", { category: "tuition", period: todayDhaka().slice(0, 7) })}>{x("+ ইনভয়েস")}</button></>}
      </div>
      <div className="mb-4 flex gap-2 border-b">{[["inv", x("ইনভয়েস ও বকেয়া")], ["pay", x("পেমেন্ট ইতিহাস")]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 font-semibold ${tab === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{l}</button>)}</div>

      {tab === "inv" && <>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select className="input !w-auto" value={f.class} onChange={(e) => setF({ ...f, class: e.target.value })} aria-label={x("শ্রেণি")}><option value="">{x("সব শ্রেণি")}</option>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select>
          <select className="input !w-auto" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} aria-label={x("মাস")}><option value="">{x("সব মাস")}</option>{months.map((m, i) => <option key={m} value={i + 1}>{x(m)}</option>)}</select>
          <input className="input !w-24" type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} aria-label={x("বছর")} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.outstanding} onChange={(e) => setF({ ...f, outstanding: e.target.checked })} /> {x("শুধু বকেয়া")}</label>
          <input className="input !w-48" placeholder={x("নাম/আইডি/ইনভয়েস নং")} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        </div>
        {d.totals && <p className="mb-3 text-sm text-slate-700">{x("ফিল্টারে মোট ধার্য")} <b>{money(d.totals.obligation)}</b> · {x("জমা")} <b className="text-brand">{money(d.totals.paid)}</b> · {x("বকেয়া")} <b className="text-red-600">{money(d.totals.due)}</b></p>}
      </>}
      {tab === "pay" && <div className="mb-3 flex items-center gap-2 text-sm"><label className="font-semibold">{x("পেমেন্টের ধরন")}</label><select className="input !w-auto" value={chan} onChange={(e) => setChan(e.target.value)}><option value="">{x("সব")}</option><option value="online">{x("অনলাইন (অনুমোদিত)")}</option><option value="office">{x("ক্যাশ/অফিস")}</option></select></div>}
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err} <button className="underline" onClick={load}>{x("আবার চেষ্টা")}</button></p>}

      <div className={`card overflow-x-auto !p-0 ${loading ? "opacity-60" : ""}`}>
        {tab === "inv" ? (
          <table className="w-full min-w-[760px]"><thead><tr>{[x("ইনভয়েস"), x("শিক্ষার্থী"), x("বিবরণ"), x("ধার্য"), x("জমা"), x("বকেয়া"), ""].map((h, hi) => <th key={hi} className="th">{h}</th>)}</tr></thead>
            <tbody>{d.items.map((i) => (
              <tr key={i._id}><td className="td whitespace-nowrap">{i.invoiceNo}</td><td className="td">{i.student.name} <span className="text-xs text-slate-500">({x(i.student.class)}-{n(i.student.roll)})</span></td>
                <td className="td">{x(i.title)}{i.period && ` — ${x(months[i.month - 1])} ${n(i.year)}`}{i.discount ? <span className="block text-xs text-slate-500">{x("ছাড় {0}", money(i.discount))}</span> : null}</td>
                <td className="td">{money(i.obligation)}</td><td className="td">{money(i.paid)}</td>
                <td className={`td font-bold ${i.due > 0 ? "text-red-600" : "text-brand"}`}>{i.due > 0 ? money(i.due) : i.due < 0 ? x("অগ্রিম {0}", money(-i.due)) : x("পরিশোধিত")}</td>
                <td className="td whitespace-nowrap text-right">
                  {can("fees.collect") && i.due > 0 && <button className="mr-2 font-semibold text-brand" onClick={() => open("pay", { invoice: i._id, label: `${i.student.name} — ${i.title}`, due: i.due, amount: i.due, method: "cash", date: todayDhaka() })}>{x("পেমেন্ট")}</button>}
                  {can("fees.manage") && <>
                    <button className="mr-2 font-semibold text-slate-700" onClick={() => open("adj", { id: i._id, label: `${i.student.name} — ${i.title}`, amount: i.amount, discount: i.discount, fine: i.fine, discountReason: i.discountReason || "" })}>{x("সমন্বয়")}</button>
                    {i.paid > 0 && <button className="mr-2 font-semibold text-amber-700" onClick={() => open("refund", { invoice: i._id, label: `${i.student.name} — ${i.title}`, max: i.paid, method: "cash", date: todayDhaka() })}>{x("রিফান্ড")}</button>}
                    {i.paid === 0 && <button className="font-semibold text-red-600" onClick={() => ask(x("ইনভয়েস বাতিলের কারণ:"), "DELETE", `/api/invoices/${i._id}`, x("ইনভয়েস বাতিল হয়েছে"))}>{x("বাতিল")}</button>}
                  </>}
                </td></tr>))}
              {!loading && d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>{x("কোনো ইনভয়েস নেই। \"মাসিক ফি তৈরি\" দিয়ে শুরু করুন।")}</td></tr>}</tbody></table>
        ) : (
          <table className="w-full min-w-[760px]"><thead><tr>{[x("রসিদ"), x("তারিখ"), x("শিক্ষার্থী"), x("বিবরণ"), x("পদ্ধতি"), x("টাকা"), ""].map((h, hi) => <th key={hi} className="th">{h}</th>)}</tr></thead>
            <tbody>{d.items.map((p) => (
              <tr key={p._id}><td className="td whitespace-nowrap">{p.receiptNo}</td><td className="td">{date(p.date)}</td><td className="td">{p.student?.name}</td><td className="td">{p.invoice?.title && x(p.invoice.title)}{p.type === "refund" && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-800">{x("রিফান্ড")}</span>}</td>
                <td className="td">{p.methodLabel || x(methodLabel[p.method])}<span className={`ml-1 rounded px-1.5 text-xs ${p.channel === "online" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{p.channel === "online" ? x("অনলাইন") : x("ক্যাশ/অফিস")}</span>{p.trxId && <span className="block text-xs text-slate-500">{p.trxId}</span>}</td><td className={`td font-bold ${p.type === "refund" ? "text-red-600" : "text-brand"}`}>{p.type === "refund" ? "−" : ""}{money(p.amount)}</td>
                <td className="td whitespace-nowrap text-right"><button className="mr-3 font-semibold text-brand" onClick={() => printUrl(`/admin/receipt/${p._id}`)}>{x("প্রিন্ট")}</button>{can("fees.manage") && <button className="font-semibold text-red-600" onClick={() => ask(x("এই লেনদেন বাতিলের কারণ:"), "POST", `/api/payments/${p._id}/void`, x("লেনদেন বাতিল হয়েছে"))}>{x("বাতিল")}</button>}</td></tr>))}
              {!loading && d.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>{x("কোনো পেমেন্ট নেই")}</td></tr>}</tbody></table>
        )}
      </div>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />

      {modal === "pay" && <Modal title={x("পেমেন্ট নিন")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/payments", { invoice: form.invoice, amount: form.amount, method: form.method, date: form.date, reference: form.reference, note: form.note }, (d) => x("✅ রসিদ {0}", d.receiptNo), (d) => window.open(`/admin/receipt/${d.id}`, "_blank"))}>
        <p className="font-semibold">{form.label}</p><p className="text-sm text-slate-600">{x("বকেয়া: {0}", money(form.due))}</p>
        <F l={x("টাকা")}><input type="number" step="0.01" min="0.01" max={form.due} required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l={x("পদ্ধতি")}><select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select></F>
        <F l={x("তারিখ")}><input type="date" required max={todayDhaka()} className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
        <F l={x("ট্রানজেকশন আইডি/রেফারেন্স")}><input className="input" onChange={(e) => setForm({ ...form, reference: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : x("পেমেন্ট নিশ্চিত করুন")}</button></form></Modal>}

      {modal === "cash" && <Modal title={x("ক্যাশ পেমেন্ট গ্রহণ")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/payments/cash", { student: form.student, invoice: form.invoice || undefined, category: form.category, period: form.category === "tuition" ? form.period : "", amount: form.amount, date: form.date, note: form.note }, (d) => x("✅ ইনভয়েস {0}", d.receiptNo), (d) => window.open(`/admin/receipt/${d.id}`, "_blank"))}>
        <p className="rounded-lg bg-brand-light p-3 text-sm">{x("শিক্ষার্থী সরাসরি টাকা দিলে এখানে লিখুন — সাথে সাথে ইনভয়েস তৈরি হবে। এই পেমেন্ট \"ক্যাশ/অফিস\" হিসেবে আলাদা চিহ্নিত থাকবে।")}</p>
        <F l={x("শিক্ষার্থী")}><select required className="input" value={form.student} onChange={async (e) => { const v = e.target.value; setForm({ ...form, student: v, invoice: "" }); setCashInv([]); if (v) { const r = await api("GET", `/api/invoices?student=${v}&outstanding=true&limit=100`); if (r.ok) setCashInv(r.d.items); } }}><option value="">{x("— বাছাই করুন —")}</option>{students.map((s) => <option key={s._id} value={s._id}>{s.name} ({x(s.class)}-{n(s.roll)}) · {s.studentId}</option>)}</select></F>
        <F l={x("কোন ফি")}><select className="input" value={form.invoice} onChange={(e) => { const inv = cashInv.find((i) => i._id === e.target.value); setForm({ ...form, invoice: e.target.value, amount: inv ? inv.due : form.amount }); }}><option value="">{x("নতুন ফি (নিচের ধরন অনুযায়ী)")}</option>{cashInv.map((i) => <option key={i._id} value={i._id}>{x(i.title)} — {x("বকেয়া {0}", money(i.due))}</option>)}</select></F>
        {!form.invoice && <><F l={x("পেমেন্টের ধরন")}><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(feeCats).filter(([k]) => k !== "fine").map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select></F>
          {form.category === "tuition" && <F l={x("মাস")}><input type="month" required className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></F>}</>}
        <F l={x("টাকার পরিমাণ")}><input type="number" step="0.01" min="0.01" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l={x("তারিখ")}><input type="date" required max={todayDhaka()} className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? x("অপেক্ষা করুন...") : x("পেমেন্ট সংরক্ষণ ও ইনভয়েস তৈরি")}</button></form></Modal>}

      {modal === "refund" && <Modal title={x("রিফান্ড")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/payments", { type: "refund", invoice: form.invoice, amount: form.amount, method: form.method, date: form.date, note: form.note }, (d) => x("✅ রিফান্ড {0}", d.receiptNo))}>
        <p className="font-semibold">{form.label}</p><p className="text-sm text-slate-600">{x("ফেরতযোগ্য: {0}", money(form.max))}</p>
        <F l={x("টাকা")}><input type="number" step="0.01" min="0.01" max={form.max} required className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l={x("পদ্ধতি")}><select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select></F>
        <F l={x("কারণ (আবশ্যক)")}><input required minLength={3} className="input" onChange={(e) => setForm({ ...form, note: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-danger w-full" disabled={busy}>{x("রিফান্ড করুন")}</button></form></Modal>}

      {modal === "adj" && <Modal title={x("ডিসকাউন্ট/জরিমানা সমন্বয়")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "PUT", `/api/invoices/${form.id}`, { amount: form.amount, discount: form.discount || 0, fine: form.fine || 0, discountReason: form.discountReason }, () => x("✅ সমন্বয় হয়েছে"))}>
        <p className="font-semibold">{form.label}</p>
        <F l={x("ধার্য টাকা")}><input type="number" min="0.01" step="0.01" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        <F l={x("ডিসকাউন্ট/স্কলারশিপ/মওকুফ")}><input type="number" min="0" step="0.01" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></F>
        <F l={x("কারণ")}><input className="input" value={form.discountReason} onChange={(e) => setForm({ ...form, discountReason: e.target.value })} /></F>
        <F l={x("জরিমানা")}><input type="number" min="0" step="0.01" className="input" value={form.fine} onChange={(e) => setForm({ ...form, fine: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{x("সংরক্ষণ")}</button></form></Modal>}

      {modal === "gen" && <Modal title={x("মাসিক ফি তৈরি")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/invoices/generate", form, (d) => x("✅ নতুন {0} টি, আগে ছিল {1} টি", d.created, d.alreadyExisted) + (d.skippedNoFee ? x(", বেতন ০ তাই বাদ {0} জন", d.skippedNoFee) : ""))}>
        <F l={x("শ্রেণি")}><select className="input" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}><option value="">{x("সব শ্রেণি")}</option>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select></F>
        <F l={x("মাস")}><select className="input" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>{months.map((m, i) => <option key={m} value={i + 1}>{x(m)}</option>)}</select></F>
        <F l={x("বছর")}><input type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></F>
        <F l={x("সবার জন্য একই টাকা (ফাঁকা = প্রত্যেকের নিজের মাসিক বেতন)")}><input type="number" min="0.01" className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{busy ? x("তৈরি হচ্ছে...") : x("ইনভয়েস তৈরি করুন")}</button></form></Modal>}

      {modal === "new" && <Modal title={x("নতুন ইনভয়েস")} onClose={() => setModal(null)}><form className="space-y-3" onSubmit={(e) => submit(e, "POST", "/api/invoices", form, (d) => x("✅ {0}", d.invoiceNo))}>
        <F l={x("শিক্ষার্থী")}><select required className="input" onChange={(e) => setForm({ ...form, student: e.target.value })}><option value="">{x("— বাছাই করুন —")}</option>{students.map((s) => <option key={s._id} value={s._id}>{s.name} ({x(s.class)}-{n(s.roll)})</option>)}</select></F>
        <F l={x("ধরন")}><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(feeCats).map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select></F>
        <F l={x("বিবরণ (ফাঁকা = ধরনের নাম)")}><input className="input" onChange={(e) => setForm({ ...form, title: e.target.value })} /></F>
        <F l={x("মাস (মাসিক বেতনে আবশ্যক)")}><input type="month" className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></F>
        <F l={x("টাকা")}><input type="number" min="0.01" step="0.01" required className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></F>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{x("তৈরি করুন")}</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
