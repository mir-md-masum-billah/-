"use client";
import { useEffect, useState, useCallback } from "react";
import useMe from "@/hooks/useMe";
import Modal from "@/components/Modal";
import { api, Pager, Toast } from "@/components/CrudPage";
import { incomeCats, expenseCats, methodLabel } from "@/lib/school";
import { useLang } from "@/components/LangProvider";
import { todayDhaka } from "@/lib/dates";
import Loader from "@/components/Loader";
import { promptBox } from "@/components/Dialog";

const first = () => todayDhaka().slice(0, 8) + "01";
export default function Accounts() {
  const me = useMe(); const { x, money, date } = useLang();
  const [range, setRange] = useState({ from: first(), to: todayDhaka() });
  const [type, setType] = useState(""); const [account, setAccount] = useState(""); const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const [sum, setSum] = useState(null); const [led, setLed] = useState({ items: [], total: 0, pages: 1, totals: { income: 0, expense: 0 } }); const [page, setPage] = useState(1);
  const [err, setErr] = useState(""); const [toast, setToast] = useState(""); const [modal, setModal] = useState(false); const [form, setForm] = useState({}); const [mErr, setMErr] = useState(""); const [busy, setBusy] = useState(false);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => setPage(1), [range, type, account]);
  const load = useCallback(async () => {
    setErr("");
    const qs = `from=${range.from}&to=${range.to}`;
    const [s, l] = await Promise.all([api("GET", `/api/accounts/summary?${qs}`), api("GET", `/api/ledger?${qs}&page=${page}&limit=20&q=${encodeURIComponent(dq)}${type ? "&type=" + type : ""}${account ? "&account=" + account : ""}`)]);
    if (s.ok) setSum(s.d); else setErr(s.d.error || x("লোড করা যায়নি"));
    if (l.ok) setLed(l.d);
  }, [range, page, dq, type, account, x]);
  useEffect(() => { load(); }, [load]);

  if (!me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const canW = me.perms.includes("accounts.write");
  const cats = form.type === "income" ? Object.entries(incomeCats).filter(([k]) => k !== "fee") : Object.entries(expenseCats).filter(([k]) => k !== "refund");
  async function save(e) {
    e.preventDefault(); setBusy(true); setMErr("");
    const r = await api("POST", "/api/ledger", form); setBusy(false);
    if (!r.ok) return setMErr(r.d.error || x("সমস্যা হয়েছে"));
    setModal(false); flash(x("✅ এন্ট্রি যোগ হয়েছে")); load();
  }
  async function voidE(e) {
    const reason = await promptBox(x("বাতিলের কারণ:"), { danger: true }); if (!reason) return;
    const r = await api("DELETE", `/api/ledger/${e._id}`, { reason }); if (!r.ok) return flash(r.d.error || x("সমস্যা হয়েছে")); flash(x("✅ বাতিল হয়েছে")); load();
  }
  const label = (e) => { const t = e.type === "income" ? incomeCats[e.category] : expenseCats[e.category]; return t ? x(t) : e.category; };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="mr-auto text-3xl text-brand-dark">{x("হিসাব নিকাশ")}</h1>
        <input type="date" className="input !w-auto" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label={x("শুরু")} />
        <input type="date" className="input !w-auto" value={range.to} min={range.from} max={todayDhaka()} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label={x("শেষ")} />
        <button className="btn-ghost" onClick={() => window.print()}>{x("প্রিন্ট")}</button>
        {canW && <button className="btn-primary" onClick={() => { setMErr(""); setForm({ type: "expense", date: todayDhaka(), account: "cash" }); setModal(true); }}>{x("+ আয়/ব্যয় এন্ট্রি")}</button>}
      </div>
      <div className="hidden print:block"><h1 className="text-xl">{x("আয়-ব্যয় বিবরণী: {0} থেকে {1}", date(range.from), date(range.to))}</h1></div>
      {err && <p className="rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {sum && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[["প্রারম্ভিক জের", sum.openingTotal], ["মোট আয়", sum.income, "text-brand"], ["মোট ব্যয়", sum.expense, "text-red-600"], ["সমাপনী জের", sum.closingTotal]].map(([l, v, c]) => <div key={l} className="card"><p className="text-sm text-slate-600">{x(l)}</p><p className={`text-xl font-bold ${c || "text-ink"}`}>{money(v)}</p></div>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card"><h2 className="mb-2 font-bold">{x("অ্যাকাউন্ট অনুযায়ী সমাপনী জের")}</h2>{Object.entries(sum.closing).map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0"><span>{x(methodLabel[k])}</span><b>{money(v)}</b></div>)}
            <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{x("মোট বকেয়া ফি (দায়): {0} ({1} টি ইনভয়েস)", money(sum.outstanding.total), sum.outstanding.invoices)}</p></div>
          <div className="card"><h2 className="mb-2 font-bold">{x("খাত অনুযায়ী")}</h2>{sum.byCategory.length === 0 ? <p className="text-slate-500">{x("এই সময়ে কোনো লেনদেন নেই")}</p> : sum.byCategory.map((c) => <div key={c.type + c.category} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0"><span>{c.type === "income" ? x("আয়") : x("ব্যয়")} · {(c.type === "income" ? incomeCats : expenseCats)[c.category] ? x((c.type === "income" ? incomeCats : expenseCats)[c.category]) : c.category}</span><b className={c.type === "income" ? "text-brand" : "text-red-600"}>{money(c.total)}</b></div>)}</div>
        </div>
      </>}
      <div>
        <div className="mb-3 flex flex-wrap gap-2 print:hidden">
          <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)}><option value="">{x("আয়+ব্যয়")}</option><option value="income">{x("শুধু আয়")}</option><option value="expense">{x("শুধু ব্যয়")}</option></select>
          <select className="input !w-auto" value={account} onChange={(e) => setAccount(e.target.value)}><option value="">{x("সব অ্যাকাউন্ট")}</option>{Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select>
          <input className="input !w-48" placeholder={x("বিবরণ/রেফারেন্স")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[700px]"><thead><tr>{["তারিখ", "বিবরণ", "খাত", "অ্যাকাউন্ট", "আয়", "ব্যয়", ""].map((h) => <th key={h} className="th">{h && x(h)}</th>)}</tr></thead>
          <tbody>{led.items.map((e) => <tr key={e._id}><td className="td whitespace-nowrap">{date(e.date)}</td><td className="td">{e.title}{e.source !== "manual" && <span className="ml-1 rounded bg-brand-light px-1.5 text-xs text-brand">{x("স্বয়ংক্রিয়")}</span>}</td><td className="td">{label(e)}</td><td className="td">{x(methodLabel[e.account])}</td>
            <td className="td font-semibold text-brand">{e.type === "income" ? money(e.amount) : ""}</td><td className="td font-semibold text-red-600">{e.type === "expense" ? money(e.amount) : ""}</td>
            <td className="td text-right print:hidden">{canW && e.source === "manual" && <button className="font-semibold text-red-600" onClick={() => voidE(e)}>{x("বাতিল")}</button>}</td></tr>)}
            {led.items.length === 0 && <tr><td className="td py-10 text-center text-slate-500" colSpan={7}>{x("কোনো লেনদেন নেই")}</td></tr>}
            <tr className="bg-slate-50 font-bold"><td className="td" colSpan={4}>{x("মোট (ফিল্টার অনুযায়ী)")}</td><td className="td text-brand">{money(led.totals.income)}</td><td className="td text-red-600">{money(led.totals.expense)}</td><td className="td" /></tr></tbody></table></div>
        <div className="print:hidden"><Pager page={page} pages={led.pages} total={led.total} setPage={setPage} /></div>
      </div>
      {modal && <Modal title={x("আয়/ব্যয় এন্ট্রি")} onClose={() => setModal(false)}><form className="space-y-3" onSubmit={save}>
        <div><label className="label">{x("ধরন")}</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: "" })}><option value="expense">{x("ব্যয়")}</option><option value="income">{x("আয়")}</option></select></div>
        <div><label className="label">{x("খাত")}</label><select required className="input" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">{x("— বাছাই করুন —")}</option>{cats.map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select></div>
        <div><label className="label">{x("বিবরণ")}</label><input required minLength={2} className="input" onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="label">{x("টাকা")}</label><input type="number" required min="0.01" step="0.01" className="input" onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        <div><label className="label">{x("তারিখ")}</label><input type="date" required max={todayDhaka()} className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label className="label">{x("অ্যাকাউন্ট")}</label><select className="input" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}>{Object.entries(methodLabel).map(([k, v]) => <option key={k} value={k}>{x(v)}</option>)}</select></div>
        <div><label className="label">{x("ভাউচার/রেফারেন্স নং (ঐচ্ছিক)")}</label><input className="input" onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
        {mErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{mErr}</p>}<button className="btn-primary w-full" disabled={busy}>{x("সংরক্ষণ")}</button></form></Modal>}
      <Toast msg={toast} />
    </div>
  );
}
