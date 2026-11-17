"use client";
import { useEffect, useState } from "react";
import { api } from "./CrudPage";
import A4Doc, { Field } from "./A4Doc";
import { methodLabel } from "@/lib/school";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";

const Stamp = ({ text, color }) => <div style={{ position: "absolute", right: "14mm", top: "112mm", transform: "rotate(-14deg)", border: `3px solid ${color}`, color, padding: "2px 18px", fontSize: 26, fontWeight: 800, opacity: 0.75, borderRadius: 6 }}>{text}</div>;

// অ্যাডমিন, শিক্ষক ও শিক্ষার্থী — সবার ইনভয়েস এই একটি কম্পোনেন্ট থেকে আসে।
// ইনভয়েসের ভাষা = ব্যবহারকারীর বেছে নেওয়া ভাষা (বাংলা হলে বাংলায়, English হলে ইংরেজিতে ছাপা হয়)। শুধু "পরিশোধিত" স্ট্যাম্প সবসময় বাংলায়।
export default function ReceiptView({ id }) {
  const { x, n, money, date, lang } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/receipt/${id}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("রসিদ পাওয়া যায়নি")))); }, [id]);
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const { payment: p, invoice: i, student: s, balance } = d;
  const refund = p.type === "refund", online = p.channel === "online";
  const th = { textAlign: "left", background: "#E8F1EC", color: "#0A4435", padding: "6px 8px", fontSize: 11, border: "1px solid #94a3b8" };
  const td = { padding: "7px 8px", border: "1px solid #cbd5e1" };
  return (
    <A4Doc title={refund ? L("রিফান্ড ভাউচার", "Refund Voucher") : L("পেমেন্ট ইনভয়েস", "Payment Invoice")} filename={`invoice-${p.receiptNo}`} code={p.receiptNo}>
      {p.voided && <Stamp text={L("বাতিল", "VOID")} color="#b91c1c" />}
      {!p.voided && !refund && <Stamp text="পরিশোধিত" color="#0A4435" />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div><p style={{ fontSize: 10, color: "#64748b" }}>{L("ইনভয়েস নং", "Invoice No")}</p><p style={{ fontSize: 20, fontWeight: 700, color: "#0A4435", letterSpacing: ".04em" }}>{p.receiptNo}</p></div>
        <div style={{ textAlign: "right" }}><p style={{ fontSize: 10, color: "#64748b" }}>{L("তারিখ", "Date")}</p><p style={{ fontWeight: 700 }}>{date(p.date)}</p>
          <span style={{ display: "inline-block", marginTop: 4, padding: "1px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: online ? "#DBEAFE" : "#FEF3C7", color: online ? "#1E40AF" : "#92400E" }}>{online ? L("অনলাইন পেমেন্ট", "Online payment") : L("ক্যাশ/অফিস", "Cash / Office")}</span></div>
      </div>
      {p.voided && <p style={{ marginTop: 8, background: "#FEE2E2", color: "#991B1B", padding: "5px 10px", borderRadius: 4, fontWeight: 600 }}>{x("এই লেনদেন বাতিল — কারণ: {0}", p.voidReason)}</p>}
      <section style={{ marginTop: 14 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 6 }}>{L("শিক্ষার্থীর তথ্য", "Student")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 22px" }}>
          <Field l={L("নাম", "Name")}>{s.name}</Field><Field l={L("আইডি", "ID")}>{s.studentId}</Field>
          <Field l={L("শ্রেণি", "Class")}>{x(s.class)}{s.section ? ` (${s.section})` : ""}</Field><Field l={L("রোল", "Roll")}>{n(s.roll)}</Field>
          {s.fatherName && <Field l={L("পিতার নাম", "Father")} className="col-span-2">{s.fatherName}</Field>}
        </div>
      </section>
      <section style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 6 }}>{L("পেমেন্টের বিবরণ", "Payment details")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>{L("খাত", "Description")}</th><th style={{ ...th, textAlign: "right" }}>{L("ধার্য", "Billed")}</th><th style={{ ...th, textAlign: "right" }}>{refund ? L("ফেরত", "Refunded") : L("জমা", "Paid")}</th></tr></thead>
          <tbody><tr><td style={td}>{x(i.title)}{i.period ? ` (${i.period})` : ""}<br /><span style={{ fontSize: 10, color: "#64748b" }}>{L("ইনভয়েস রেফারেন্স", "Invoice reference")}: {i.invoiceNo}</span></td><td style={{ ...td, textAlign: "right" }}>{money(balance.obligation)}</td><td style={{ ...td, textAlign: "right", fontWeight: 800, fontSize: 16, color: "#0A4435" }}>{money(p.amount)}</td></tr></tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <table style={{ minWidth: 250, fontSize: 12 }}><tbody>
            <tr><td style={{ padding: "2px 10px" }}>{L("মোট জমা (সব পেমেন্ট)", "Total paid")}</td><td style={{ textAlign: "right", fontWeight: 600 }}>{money(balance.paid)}</td></tr>
            <tr><td style={{ padding: "2px 10px" }}>{L("বর্তমান বকেয়া", "Balance due")}</td><td style={{ textAlign: "right", fontWeight: 700, color: balance.due > 0 ? "#b91c1c" : "#0A4435" }}>{money(Math.max(0, balance.due))}</td></tr>
          </tbody></table>
        </div>
      </section>
      <section style={{ marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 22px" }}>
          <Field l={L("পেমেন্ট মাধ্যম", "Method")}>{p.methodLabel || x(methodLabel[p.method])}</Field>
          {online ? <Field l={L("ট্রানজেকশন আইডি", "Transaction ID")}>{p.trxId}</Field> : <Field l={L("রেফারেন্স", "Reference")}>{p.reference}</Field>}
          {online && <><Field l={L("যে নম্বর থেকে পাঠানো", "Sender")}>{p.senderNumber}</Field><Field l={L("যে নম্বরে পাঠানো", "Receiver")}>{p.receiverNumber}</Field></>}
          <Field l={online ? L("যাচাইকারী", "Verified by") : L("আদায়কারী", "Received by")}>{p.createdByName}</Field>
          {p.note && !online && <Field l={L("নোট", "Note")}>{p.note}</Field>}
        </div>
      </section>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 70, fontSize: 11 }}>
        <span style={{ borderTop: "1px solid #64748b", padding: "3px 22px" }}>{L("অভিভাবকের স্বাক্ষর", "Guardian signature")}</span>
        <span style={{ borderTop: "1px solid #64748b", padding: "3px 22px" }}>{L("কর্তৃপক্ষের স্বাক্ষর", "Authorised signature")}</span>
      </div>
    </A4Doc>
  );
}
