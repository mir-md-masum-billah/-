"use client";
import { useEffect, useState, use } from "react";
import { api } from "@/components/CrudPage";
import { money, methodLabel, bn } from "@/lib/school";

export default function Receipt({ params }) {
  const { id } = use(params);
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/receipt/${id}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || "রসিদ পাওয়া যায়নি"))); }, [id]);
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <p>লোড হচ্ছে...</p>;
  const { payment: p, invoice: i, student: s, school, balance } = d;
  return (
    <div className="mx-auto max-w-2xl">
      <button className="btn-primary mb-4 print:hidden" onClick={() => window.print()}>🖨 প্রিন্ট করুন</button>
      <div className="rounded-xl border-2 border-slate-300 bg-white p-6 print:border-0">
        <div className="border-b-2 border-brand pb-3 text-center">
          {school.logo && <img src={school.logo} alt="" className="mx-auto mb-1 h-14" />}
          <h1 className="text-2xl font-bold text-brand">{school.name}</h1><p className="text-sm text-slate-600">{school.address} {school.phone && "· " + school.phone}</p>
          <p className="mt-2 inline-block rounded bg-brand px-3 py-0.5 font-semibold text-white">{p.type === "refund" ? "রিফান্ড ভাউচার" : "টাকা প্রাপ্তির রসিদ"}</p>
        </div>
        {p.voided && <p className="mt-3 rounded bg-red-100 p-2 text-center font-bold text-red-700">⚠ এই লেনদেন বাতিল — কারণ: {p.voidReason}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><p>রসিদ নং: <b>{p.receiptNo}</b></p><p className="text-right">তারিখ: <b>{p.date}</b></p>
          <p>শিক্ষার্থী: <b>{s.name}</b></p><p className="text-right">আইডি: <b>{s.studentId}</b></p><p>শ্রেণি: <b>{s.class}{s.section ? ` (${s.section})` : ""}</b>, রোল: <b>{bn(s.roll)}</b></p><p className="text-right">পদ্ধতি: <b>{methodLabel[p.method]}</b></p>
          {p.reference && <p className="col-span-2">রেফারেন্স: {p.reference}</p>}</div>
        <table className="mt-4 w-full text-sm"><tbody>
          <tr className="border-y"><td className="py-2">{i.title}{i.period ? ` (${i.period})` : ""} — ইনভয়েস {i.invoiceNo}</td><td className="py-2 text-right">ধার্য {money(balance.obligation)}</td></tr>
          <tr className="border-b font-bold"><td className="py-2">{p.type === "refund" ? "ফেরত টাকা" : "এই রসিদে জমা"}</td><td className="py-2 text-right text-lg">{money(p.amount)}</td></tr>
          <tr><td className="py-2">মোট জমা (সব রসিদ মিলিয়ে)</td><td className="py-2 text-right">{money(balance.paid)}</td></tr>
          <tr><td className="py-2">বর্তমান বকেয়া</td><td className="py-2 text-right font-bold">{money(Math.max(0, balance.due))}</td></tr></tbody></table>
        <div className="mt-14 flex justify-between text-sm"><span className="border-t border-slate-500 px-6 pt-1">অভিভাবকের স্বাক্ষর</span><span className="border-t border-slate-500 px-6 pt-1">আদায়কারীর স্বাক্ষর ({p.createdByName})</span></div>
      </div>
    </div>
  );
}
