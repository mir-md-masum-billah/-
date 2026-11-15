"use client";
import { useEffect, useState } from "react";
import { api } from "./CrudPage";
import Crest from "./Crest";
import Icon from "./Icon";
import { methodLabel } from "@/lib/school";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { realOnly } from "@/lib/school";

// অ্যাডমিন ও শিক্ষার্থী — দুই জায়গার রসিদই এই একটি কম্পোনেন্ট থেকে আসে
export default function ReceiptView({ id }) {
  const { x, n, money, date } = useLang();
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/receipt/${id}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("রসিদ পাওয়া যায়নি")))); }, [id]);
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const { payment: p, invoice: i, student: s, school, balance } = d;
  return (
    <div className="mx-auto max-w-2xl">
      <button className="btn-primary mb-5 print:hidden" onClick={() => window.print()}><Icon name="print" className="h-4 w-4" /> {x("প্রিন্ট করুন")}</button>
      <div className="rounded-xl border border-gold bg-white p-2 shadow-lux print:border-0 print:p-0 print:shadow-none">
        <div className="rounded-lg border border-gold/50 p-6 sm:p-8 print:border-gold">
          <div className="border-b border-gold/60 pb-5 text-center">
            {school.logo ? <img src={school.logo} alt="" className="mx-auto mb-2 h-14" /> : <Crest className="mx-auto mb-2 h-12 w-auto text-gold-deep" />}
            <h1 className="text-3xl text-brand-dark">{school.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{[realOnly(school.address), realOnly(school.phone)].filter(Boolean).join(" · ")}</p>
            <p className="mt-3 inline-block rounded-sm border border-gold bg-gold-light px-4 py-0.5 font-semibold text-brand-dark">{p.type === "refund" ? x("রিফান্ড ভাউচার") : x("টাকা প্রাপ্তির রসিদ")}</p>
          </div>
          {p.voided && <p className="mt-4 flex items-center justify-center gap-2 rounded bg-red-100 p-2 text-center font-bold text-red-700"><Icon name="warn" className="h-5 w-5" /> {x("এই লেনদেন বাতিল — কারণ: {0}", p.voidReason)}</p>}
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm"><p>{x("রসিদ নং:")} <b>{p.receiptNo}</b></p><p className="text-right">{x("তারিখ:")} <b>{date(p.date)}</b></p>
            <p>{x("শিক্ষার্থী")}: <b>{s.name}</b></p><p className="text-right">{x("আইডি")}: <b>{s.studentId}</b></p><p>{x("শ্রেণি:")} <b>{x(s.class)}{s.section ? ` (${s.section})` : ""}</b>, {x("রোল:")} <b>{n(s.roll)}</b></p><p className="text-right">{x("পদ্ধতি:")} <b>{x(methodLabel[p.method])}</b></p>
            {p.reference && <p className="col-span-2">{x("রেফারেন্স:")} {p.reference}</p>}</div>
          <table className="mt-5 w-full text-sm"><tbody>
            <tr className="border-y border-gold/50"><td className="py-2.5">{x(i.title)}{i.period ? ` (${i.period})` : ""} — {x("ইনভয়েস {0}", i.invoiceNo)}</td><td className="py-2.5 text-right">{x("ধার্য {0}", money(balance.obligation))}</td></tr>
            <tr className="border-b border-gold/50 font-bold"><td className="py-2.5">{p.type === "refund" ? x("ফেরত টাকা") : x("এই রসিদে জমা")}</td><td className="py-2.5 text-right font-display text-2xl font-normal text-brand-dark">{money(p.amount)}</td></tr>
            <tr><td className="py-2.5">{x("মোট জমা (সব রসিদ মিলিয়ে)")}</td><td className="py-2.5 text-right">{money(balance.paid)}</td></tr>
            <tr><td className="py-2.5">{x("বর্তমান বকেয়া")}</td><td className="py-2.5 text-right font-bold">{money(Math.max(0, balance.due))}</td></tr></tbody></table>
          <div className="mt-16 flex justify-between gap-4 text-sm"><span className="border-t border-slate-500 px-4 pt-1 sm:px-6">{x("অভিভাবকের স্বাক্ষর")}</span><span className="border-t border-slate-500 px-4 pt-1 text-right sm:px-6">{x("আদায়কারীর স্বাক্ষর ({0})", p.createdByName)}</span></div>
        </div>
      </div>
    </div>
  );
}
