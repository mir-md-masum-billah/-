"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useMe from "@/hooks/useMe";
import { api } from "@/components/CrudPage";
import Icon from "@/components/Icon";
import { useLang } from "@/components/LangProvider";

const ymNow = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());

function Stat({ l, v, tone }) {
  return (
    <div className="card !p-5">
      <p className="text-sm text-slate-600">{l}</p>
      <p className={`mt-1.5 font-display text-3xl leading-tight ${tone || "text-brand-dark"}`}>{v}</p>
    </div>
  );
}
function Group({ title, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-4"><h2 className="font-display text-2xl text-brand-dark">{title}</h2><span className="h-px flex-1 bg-gradient-to-r from-gold/60 to-transparent" /></div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const me = useMe(); const { x, n, money, date } = useLang();
  const [s, setS] = useState(null); const [err, setErr] = useState("");
  const [sum, setSum] = useState(null);
  const today = ymNow();
  const [range, setRange] = useState({ from: today.slice(0, 8) + "01", to: today });

  useEffect(() => { api("GET", "/api/stats").then((r) => (r.ok ? setS(r.d) : setErr(r.d.error || x("লোড করা যায়নি")))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (me?.perms?.includes("accounts.read")) api("GET", `/api/accounts/summary?from=${range.from}&to=${range.to}`).then((r) => r.ok && setSum(r.d)); }, [me, range]);

  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!s) return <p className="text-slate-500">{x("লোড হচ্ছে...")}</p>;
  const max = sum ? Math.max(1, ...sum.monthly.map((m) => Math.max(m.income, m.expense))) : 1;
  const hasPeople = s.students !== undefined || s.teachers !== undefined;
  const hasMoney = s.outstanding !== undefined || s.feeCollected !== undefined;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl text-brand-dark">{x("ড্যাশবোর্ড")}</h1>
        <p className="mt-1 text-slate-600">{me?.name ? x("স্বাগতম, {0} — ", me.name) : ""}{x("আজ {0}", date(today))}</p>
        <span className="gold-rule mt-4" />
      </header>

      {hasPeople && (
        <Group title={x("শিক্ষার্থী ও শিক্ষক")}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {s.students !== undefined && <><Stat l={x("মোট শিক্ষার্থী")} v={n(s.students)} /><Stat l={x("সক্রিয় শিক্ষার্থী")} v={n(s.activeStudents)} /><Stat l={x("এ মাসে নতুন ভর্তি")} v={n(s.newAdmissions)} /></>}
            {s.teachers !== undefined && <><Stat l={x("শিক্ষক")} v={n(s.teachers)} /><Stat l={x("অন্যান্য কর্মচারী")} v={n(s.employees)} /></>}
          </div>
        </Group>
      )}

      {s.present !== undefined && (
        <Group title={x("আজকের হাজিরা")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat l={x("আজ উপস্থিত")} v={n(s.present)} />
            <Stat l={x("আজ অনুপস্থিত")} v={n(s.absent)} tone={s.absent ? "text-red-600" : undefined} />
            <div className="card col-span-2 !p-5 sm:col-span-1">
              <p className="text-sm text-slate-600">{x("আজকের উপস্থিতির হার")}</p>
              <p className="mt-1.5 font-display text-3xl leading-tight text-brand-dark">{s.attendancePct === null ? <span className="text-xl text-slate-500">{x("হাজিরা নেওয়া হয়নি")}</span> : n(s.attendancePct) + "%"}</p>
              {s.attendancePct !== null && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-light"><div className="h-full rounded-full bg-gradient-to-r from-brand to-gold" style={{ width: s.attendancePct + "%" }} /></div>}
            </div>
          </div>
        </Group>
      )}

      {hasMoney && (
        <Group title={x("আর্থিক অবস্থা")}>
          <div className="space-y-4">
            {s.feeCollected !== undefined && (
              <div className="lattice overflow-hidden rounded-2xl bg-night p-6 text-white shadow-gilt sm:p-8">
                <p className="text-sm text-gold-soft">{x("বর্তমান ব্যালেন্স")}</p>
                <dl className="mt-4 grid gap-6 sm:grid-cols-3">
                  {[["ক্যাশ", s.cashBalance], ["ব্যাংক", s.bankBalance], ["বিকাশ/নগদ", s.mobileBalance]].map(([l, v]) => (
                    <div key={l} className="flex flex-col-reverse border-l border-gold/40 pl-4">
                      <dt className="text-sm text-white/70">{x(l)}</dt>
                      <dd className="font-display text-3xl sm:text-4xl">{money(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {s.outstanding !== undefined && <Stat l={x("মোট বকেয়া ফি")} v={money(s.outstanding)} tone={s.outstanding ? "text-red-600" : undefined} />}
              {s.feeCollected !== undefined && <><Stat l={x("এ মাসে বেতন আদায়")} v={money(s.feeCollected)} /><Stat l={x("এ মাসের মোট আয়")} v={money(s.monthIncome)} /><Stat l={x("এ মাসের মোট ব্যয়")} v={money(s.monthExpense)} /><Stat l={x("এ মাসে বেতন (শিক্ষক/স্টাফ) ব্যয়")} v={money(s.salaryExpense)} /></>}
            </div>
          </div>
        </Group>
      )}

      {sum && (
        <Group title={x("আয়-ব্যয়")}>
          <div className="card !p-5 sm:!p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="mr-auto text-sm text-slate-600">{x("তারিখ বাছাই করুন")}</span>
              <input type="date" className="input !w-auto" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} aria-label={x("শুরুর তারিখ")} />
              <input type="date" className="input !w-auto" value={range.to} min={range.from} max={today} onChange={(e) => setRange({ ...range, to: e.target.value })} aria-label={x("শেষ তারিখ")} />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[["প্রারম্ভিক জের", sum.openingTotal, ""], ["আয়", sum.income, "text-brand"], ["ব্যয়", sum.expense, "text-red-600"], ["সমাপনী জের", sum.closingTotal, "text-brand-dark"]].map(([l, v, t], i) => (
                <div key={l} className={i === 3 ? "border-gold/50 sm:border-l sm:pl-6" : ""}><p className="text-sm text-slate-600">{x(l)}</p><p className={`font-display text-2xl ${t}`}>{money(v)}</p></div>
              ))}
            </div>
            <h3 className="mb-3 mt-8 font-semibold text-slate-700">{x("গত ১২ মাস")}</h3>
            <div className="flex h-44 items-end gap-1.5 overflow-x-auto border-b border-slate-200" role="img" aria-label={x("মাসভিত্তিক আয় ও ব্যয়ের চার্ট")}>
              {sum.monthly.map((m) => (
                <div key={m.m} className="flex h-full min-w-[28px] flex-1 flex-col items-center justify-end gap-1" title={x("{0}: আয় {1}, ব্যয় {2}", m.m, m.income, m.expense)}>
                  <div className="flex h-36 w-full items-end gap-0.5"><div className="flex-1 rounded-t-sm bg-brand" style={{ height: (m.income / max) * 100 + "%" }} /><div className="flex-1 rounded-t-sm bg-gold" style={{ height: (m.expense / max) * 100 + "%" }} /></div>
                  <span className="text-[10px] text-slate-500">{m.m.slice(5)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-4 text-xs text-slate-600"><span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" />{x("আয়")}</span><span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold" />{x("ব্যয়")}</span></p>
          </div>
        </Group>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {s.recent && (
          <section className="card !p-0">
            <h2 className="border-b border-gold/40 px-5 py-4 font-display text-xl text-brand-dark">{x("সাম্প্রতিক লেনদেন")}</h2>
            <div className="px-5">
              {s.recent.length === 0 ? <p className="py-6 text-slate-500">{x("কোনো লেনদেন নেই")}</p> : s.recent.map((e) => (
                <div key={e._id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm last:border-0"><span className="min-w-0"><span className="block text-xs text-slate-500">{date(e.date)}</span><span className="block truncate">{e.title}</span></span><b className={`shrink-0 ${e.type === "income" ? "text-brand" : "text-red-600"}`}>{e.type === "income" ? "+" : "−"}{money(e.amount)}</b></div>
              ))}
            </div>
          </section>
        )}
        <section className="card !p-0">
          <div className="flex items-center justify-between border-b border-gold/40 px-5 py-4"><h2 className="font-display text-xl text-brand-dark">{x("সাম্প্রতিক নোটিশ")}</h2><Link href="/notices" className="flex items-center gap-1 text-sm font-semibold text-brand">{x("সব")} <Icon name="arrowRight" className="h-4 w-4" /></Link></div>
          <div className="px-5">
            {s.notices.length === 0 ? <p className="py-6 text-slate-500">{x("কোনো নোটিশ নেই")}</p> : s.notices.map((nt) => <div key={nt._id} className="border-b border-slate-100 py-3 text-sm last:border-0"><span className="block text-xs text-slate-500">{date(nt.date)}</span>{nt.title}</div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
