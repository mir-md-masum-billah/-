"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useMe from "@/hooks/useMe";
import { money, bn } from "@/lib/school";
import { api } from "@/components/CrudPage";

const ymNow = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
function Card({ l, v, tone }) { return <div className="card"><p className="text-sm text-slate-600">{l}</p><p className={`mt-1 text-xl font-bold sm:text-2xl ${tone || "text-brand"}`}>{v}</p></div>; }

export default function Dashboard() {
  const me = useMe();
  const [s, setS] = useState(null); const [err, setErr] = useState("");
  const [sum, setSum] = useState(null);
  const today = ymNow();
  const [range, setRange] = useState({ from: today.slice(0, 8) + "01", to: today });

  useEffect(() => { api("GET", "/api/stats").then((r) => (r.ok ? setS(r.d) : setErr(r.d.error || "লোড করা যায়নি"))); }, []);
  useEffect(() => { if (me?.perms?.includes("accounts.read")) api("GET", `/api/accounts/summary?from=${range.from}&to=${range.to}`).then((r) => r.ok && setSum(r.d)); }, [me, range]);

  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!s) return <p>লোড হচ্ছে...</p>;
  const max = sum ? Math.max(1, ...sum.monthly.map((m) => Math.max(m.income, m.expense))) : 1;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {s.students !== undefined && <><Card l="মোট শিক্ষার্থী" v={bn(s.students)} /><Card l="সক্রিয় শিক্ষার্থী" v={bn(s.activeStudents)} /><Card l="এ মাসে নতুন ভর্তি" v={bn(s.newAdmissions)} /></>}
        {s.teachers !== undefined && <><Card l="শিক্ষক" v={bn(s.teachers)} /><Card l="অন্যান্য কর্মচারী" v={bn(s.employees)} /></>}
        {s.present !== undefined && <><Card l="আজ উপস্থিত" v={bn(s.present)} /><Card l="আজ অনুপস্থিত" v={bn(s.absent)} tone={s.absent ? "text-red-600" : undefined} /><Card l="আজকের উপস্থিতির হার" v={s.attendancePct === null ? "হাজিরা নেওয়া হয়নি" : bn(s.attendancePct) + "%"} /></>}
        {s.outstanding !== undefined && <Card l="মোট বকেয়া ফি" v={money(s.outstanding)} tone={s.outstanding ? "text-red-600" : undefined} />}
        {s.feeCollected !== undefined && <><Card l="এ মাসে বেতন আদায়" v={money(s.feeCollected)} /><Card l="এ মাসের মোট আয়" v={money(s.monthIncome)} /><Card l="এ মাসের মোট ব্যয়" v={money(s.monthExpense)} /><Card l="এ মাসে বেতন (শিক্ষক/স্টাফ) ব্যয়" v={money(s.salaryExpense)} /><Card l="ক্যাশ ব্যালেন্স" v={money(s.cashBalance)} /><Card l="ব্যাংক ব্যালেন্স" v={money(s.bankBalance)} /><Card l="বিকাশ/নগদ ব্যালেন্স" v={money(s.mobileBalance)} /></>}
      </div>

      {sum && (
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto font-bold">আয়-ব্যয় (তারিখ অনুযায়ী)</h2>
            <input type="date" className="input !w-auto" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label="শুরুর তারিখ" />
            <input type="date" className="input !w-auto" value={range.to} min={range.from} max={today} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label="শেষ তারিখ" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card l="প্রারম্ভিক জের" v={money(sum.openingTotal)} /><Card l="আয়" v={money(sum.income)} /><Card l="ব্যয়" v={money(sum.expense)} tone="text-red-600" /><Card l="সমাপনী জের" v={money(sum.closingTotal)} />
          </div>
          <h3 className="mb-2 mt-5 font-semibold">গত ১২ মাস</h3>
          <div className="flex h-40 items-end gap-1 overflow-x-auto" role="img" aria-label="মাসভিত্তিক আয় ও ব্যয়ের চার্ট">
            {sum.monthly.map((m) => (
              <div key={m.m} className="flex min-w-[26px] flex-1 flex-col items-center gap-1" title={`${m.m}: আয় ${m.income}, ব্যয় ${m.expense}`}>
                <div className="flex h-32 w-full items-end gap-0.5"><div className="flex-1 rounded-t bg-brand" style={{ height: (m.income / max) * 100 + "%" }} /><div className="flex-1 rounded-t bg-gold" style={{ height: (m.expense / max) * 100 + "%" }} /></div>
                <span className="text-[10px] text-slate-500">{m.m.slice(5)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500"><span className="mr-1 inline-block h-2 w-2 rounded bg-brand" />আয় <span className="ml-3 mr-1 inline-block h-2 w-2 rounded bg-gold" />ব্যয়</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {s.recent && (
          <div className="card"><h2 className="mb-2 font-bold">সাম্প্রতিক লেনদেন</h2>
            {s.recent.length === 0 ? <p className="text-slate-500">কোনো লেনদেন নেই</p> : s.recent.map((e) => (
              <div key={e._id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0"><span>{e.date} · {e.title}</span><b className={e.type === "income" ? "text-brand" : "text-red-600"}>{e.type === "income" ? "+" : "−"}{money(e.amount)}</b></div>
            ))}</div>
        )}
        <div className="card"><div className="mb-2 flex justify-between"><h2 className="font-bold">সাম্প্রতিক নোটিশ</h2><Link href="/notices" className="text-sm text-brand">সব</Link></div>
          {s.notices.length === 0 ? <p className="text-slate-500">কোনো নোটিশ নেই</p> : s.notices.map((n) => <p key={n._id} className="border-b border-slate-100 py-2 text-sm last:border-0">{n.date} · {n.title}</p>)}</div>
      </div>
    </div>
  );
}
