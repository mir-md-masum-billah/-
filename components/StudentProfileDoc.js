"use client";
import A4Doc, { Field } from "./A4Doc";
import { useLang } from "./LangProvider";
import { methodLabel } from "@/lib/school";

// শিক্ষার্থীর পূর্ণ প্রোফাইল বা পেমেন্ট ইতিহাস (mode = "profile" | "pay") — অ্যাডমিন ও শিক্ষার্থী দুজনের জন্য একই নথি
export default function StudentProfileDoc({ student: s, payments = [], subjects = [], due, mode = "profile", back }) {
  const { x, n, money, date } = useLang();
  const B = "1px solid #334155";
  const th = { border: B, background: "#E5E7EB", padding: "6px 5px", fontSize: 11, textAlign: "center" }, td = { border: B, padding: "6px 5px", fontSize: 11.5, textAlign: "center" };
  const pay = mode === "pay";
  const total = payments.reduce((t, p) => t + (p.type === "refund" ? -p.amount : p.amount), 0);
  return (
    <A4Doc back={back} title={pay ? x("পেমেন্ট ইতিহাস") : x("শিক্ষার্থী প্রোফাইল")} filename={`${pay ? "payments" : "profile"}-${s.studentId}`} code={s.studentId}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", alignContent: "start" }}>
          <Field l={x("নাম")} className="col-span-2">{s.name}</Field>
          <Field l={x("আইডি")}>{s.studentId}</Field><Field l={x("রোল")}>{n(s.roll)}</Field>
          <Field l={x("শ্রেণি")}>{x(s.class)}</Field><Field l={x("শাখা")}>{s.section}</Field>
          {s.session && <Field l={x("সেশন")}>{s.session}</Field>}
        </div>
        <div style={{ width: 110, height: 130, border: "1.5px solid #C49B3F", borderRadius: 4, overflow: "hidden", display: "grid", placeItems: "center", background: "#f8fafc" }}>{s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#94a3b8" }}>{x("ছবি")}</span>}</div>
      </div>
      {!pay && <>
        <section style={{ marginTop: 14 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 6 }}>{x("ব্যক্তিগত তথ্য")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            <Field l={x("লিঙ্গ")}>{{ male: x("ছেলে"), female: x("মেয়ে"), other: x("অন্যান্য") }[s.gender]}</Field><Field l={x("জন্ম তারিখ")}>{s.dob && date(s.dob)}</Field>
            <Field l={x("জন্মনিবন্ধন নং")}>{s.birthRegNo}</Field><Field l={x("ভর্তির তারিখ")}>{s.admissionDate && date(s.admissionDate)}</Field>
            <Field l={x("পিতার নাম")}>{s.fatherName}</Field><Field l={x("মাতার নাম")}>{s.motherName}</Field>
            <Field l={x("অভিভাবক")}>{s.guardianName}</Field><Field l={x("অভিভাবকের ফোন")}>{s.guardianPhone}</Field>
            <Field l={x("ফোন")}>{[s.phone, ...(s.otherPhones || [])].filter(Boolean).join(", ")}</Field><Field l={x("মাসিক বেতন")}>{money(s.monthlyFee)}</Field>
            <Field l={x("আগের স্কুল")}>{[s.previousSchool, s.previousClass && x(s.previousClass)].filter(Boolean).join(" — ")}</Field>{due !== undefined && <Field l={x("বকেয়া ফি")}>{money(due)}</Field>}
            <Field l={x("ঠিকানা")} className="col-span-2">{s.address}</Field>
          </div></section>
        {subjects.length > 0 && <section style={{ marginTop: 14 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 6 }}>{x("বিষয়সমূহ")}</h3><p>{subjects.map((o) => x(o.name)).join(" · ")}</p></section>}
      </>}
      {(pay || payments.length > 0) && <section style={{ marginTop: 16 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 6 }}>{x("পেমেন্ট ইতিহাস")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>#</th><th style={th}>{x("তারিখ")}</th><th style={th}>{x("ইনভয়েস নং")}</th><th style={th}>{x("খাত")}</th><th style={th}>{x("মাধ্যম")}</th><th style={th}>{x("টাকা")}</th></tr></thead>
          <tbody>{payments.map((p, i) => <tr key={p._id} style={{ breakInside: "avoid" }}><td style={td}>{n(i + 1)}</td><td style={td}>{date(p.date)}</td><td style={td}>{p.receiptNo}</td><td style={td}>{p.invoice?.title ? x(p.invoice.title) : ""}{p.invoice?.period ? ` (${p.invoice.period})` : ""}{p.type === "refund" ? ` — ${x("রিফান্ড")}` : ""}</td><td style={td}>{p.methodLabel || x(methodLabel[p.method])}</td><td style={{ ...td, fontWeight: 700 }}>{p.type === "refund" ? "−" : ""}{money(p.amount)}</td></tr>)}
            {payments.length === 0 && <tr><td style={td} colSpan={6}>{x("কোনো পেমেন্ট নেই")}</td></tr>}
            {payments.length > 0 && <tr><td style={{ ...td, textAlign: "right", fontWeight: 700 }} colSpan={5}>{x("মোট জমা")}</td><td style={{ ...td, fontWeight: 800 }}>{money(total)}</td></tr>}</tbody>
        </table></section>}
    </A4Doc>
  );
}
