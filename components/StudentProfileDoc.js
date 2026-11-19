"use client";
import A4Doc, { Field } from "./A4Doc";
import { useLang } from "./LangProvider";
import { methodLabel, months } from "@/lib/school";
import { studentTag } from "@/lib/docname";

// শিক্ষার্থীর নথি (mode = "profile" | "pay"):
//   profile = শুধু প্রোফাইলের তথ্য (পেমেন্ট ইতিহাস থাকে না)
//   pay     = শুধু প্রয়োজনীয় পরিচয় (নাম, ফোন, আইডি, শ্রেণি, রোল, শাখা) + পেমেন্ট ইতিহাস
// অ্যাডমিন, শিক্ষক ও শিক্ষার্থী — তিনজনের জন্য একই নথি। multi = একসাথে অনেক নথি প্রিন্টের ভেতরে
export default function StudentProfileDoc({ student: s, payments = [], invoices = [], subjects = [], due, mode = "profile", back, multi = false }) {
  const { x, n, money, date, lang } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const B = "1px solid #334155";
  const th = { border: B, background: "#E5E7EB", padding: "6px 5px", fontSize: 11, textAlign: "center" }, td = { border: B, padding: "6px 5px", fontSize: 11.5, textAlign: "center" };
  const pay = mode === "pay", fees = mode === "fees";
  const total = payments.reduce((t, p) => t + (p.type === "refund" ? -p.amount : p.amount), 0);
  const phones = [s.phone, ...(s.otherPhones || [])].filter(Boolean).join(", ");
  const h3 = { fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 6 };
  return (
    <A4Doc back={back} multi={multi} title={fees ? L("ফি বিবরণী (বকেয়া ও পরিশোধ)", "Fee Statement (Dues & Payments)") : pay ? L("পেমেন্ট ইতিহাস", "Payment History") : L("শিক্ষার্থী প্রোফাইল", "Student Profile")} docTitle={`${studentTag(s, { x, n, lang })} - ${fees ? L("ফি বিবরণী", "Fee Statement") : pay ? L("পেমেন্ট ইতিহাস", "Payment History") : L("প্রোফাইল", "Profile")}`} code={s.studentId}>
      {pay || fees ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
          <Field l={L("নাম", "Name")} className="col-span-2">{s.name}</Field>
          <Field l={L("আইডি", "ID")}>{s.studentId}</Field><Field l={L("ফোন", "Phone")}>{phones || s.guardianPhone}</Field>
          <Field l={L("শ্রেণি", "Class")}>{x(s.class)}</Field><Field l={L("রোল", "Roll")}>{n(s.roll)}</Field>
          <Field l={L("শাখা", "Section")}>{s.section}</Field>{s.session && <Field l={L("সেশন", "Session")}>{s.session}</Field>}
        </div>
      ) : (<>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", alignContent: "start" }}>
            <Field l={L("নাম", "Name")} className="col-span-2">{s.name}</Field>
            <Field l={L("আইডি", "ID")}>{s.studentId}</Field><Field l={L("রোল", "Roll")}>{n(s.roll)}</Field>
            <Field l={L("শ্রেণি", "Class")}>{x(s.class)}</Field><Field l={L("শাখা", "Section")}>{s.section}</Field>
            {s.session && <Field l={L("সেশন", "Session")}>{s.session}</Field>}
          </div>
          <div style={{ width: 110, height: 130, border: "1.5px solid #C49B3F", borderRadius: 4, overflow: "hidden", display: "grid", placeItems: "center", background: "#f8fafc" }}>{s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#94a3b8" }}>{L("ছবি", "Photo")}</span>}</div>
        </div>
        <section style={{ marginTop: 14 }}><h3 style={h3}>{L("ব্যক্তিগত তথ্য", "Personal information")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
            <Field l={L("লিঙ্গ", "Gender")}>{{ male: L("ছেলে", "Male"), female: L("মেয়ে", "Female"), other: L("অন্যান্য", "Other") }[s.gender]}</Field><Field l={L("জন্ম তারিখ", "Date of birth")}>{s.dob && date(s.dob)}</Field>
            <Field l={L("জন্মনিবন্ধন নং", "Birth reg. no.")}>{s.birthRegNo}</Field><Field l={L("ভর্তির তারিখ", "Admission date")}>{s.admissionDate && date(s.admissionDate)}</Field>
            <Field l={L("পিতার নাম", "Father's name")}>{s.fatherName}</Field><Field l={L("মাতার নাম", "Mother's name")}>{s.motherName}</Field>
            <Field l={L("অভিভাবক", "Guardian")}>{s.guardianName}</Field><Field l={L("অভিভাবকের ফোন", "Guardian phone")}>{s.guardianPhone}</Field>
            <Field l={L("ফোন", "Phone")}>{phones}</Field><Field l={L("মাসিক বেতন", "Monthly fee")}>{money(s.monthlyFee)}</Field>
            <Field l={L("আগের স্কুল", "Previous school")}>{[s.previousSchool, s.previousClass && x(s.previousClass)].filter(Boolean).join(" — ")}</Field>
            <Field l={L("ঠিকানা", "Address")} className="col-span-2">{s.address}</Field>
          </div></section>
        {subjects.length > 0 && <section style={{ marginTop: 14 }}><h3 style={h3}>{L("বিষয়সমূহ", "Subjects")}</h3><p>{subjects.map((o) => x(o.name)).join(" · ")}</p></section>}
      </>)}

      {fees && (() => {
        const byInv = {}; for (const p of payments) { const k = String(p.invoice?._id || p.invoice || ""); (byInv[k] = byInv[k] || []).push(p); }
        const rows = [...invoices].sort((a, b) => (a.year || 0) - (b.year || 0) || (a.month || 0) - (b.month || 0));
        const label = (i) => (i.period && /^\d{4}-\d{2}$/.test(i.period) ? `${x(months[Number(i.period.slice(5)) - 1])} ${n(i.period.slice(0, 4)).replace(/[,،]/g, "")}` : i.period || "—");
        const st = (i) => (i.due <= 0 ? [L("পরিশোধিত", "Paid"), "#0A4435"] : i.paid > 0 ? [L("আংশিক", "Partial"), "#b45309"] : [L("বকেয়া", "Due"), "#b91c1c"]);
        const dueRows = rows.filter((i) => i.due > 0), paidRows = rows.filter((i) => i.due <= 0);
        const tot = (k) => rows.reduce((t, i) => t + (i[k] || 0), 0);
        return (<section style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[[L("মোট ধার্য", "Total payable"), money(tot("obligation")), "#0f172a"], [L("মোট জমা", "Total paid"), money(tot("paid")), "#0A4435"], [L("মোট বকেয়া", "Total due"), money(dueRows.reduce((t, i) => t + i.due, 0)), "#b91c1c"]].map(([l, v, c]) => <div key={l} style={{ border: "1px solid #C49B3F", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}><p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{l}</p><p style={{ fontSize: 17, fontWeight: 800, color: c, margin: 0 }}>{v}</p></div>)}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>#</th><th style={th}>{L("মাস / সময়", "Month / period")}</th><th style={th}>{L("খাত", "Item")}</th><th style={th}>{L("ধার্য", "Payable")}</th><th style={th}>{L("জমা", "Paid")}</th><th style={th}>{L("বকেয়া", "Due")}</th><th style={th}>{L("অবস্থা", "Status")}</th><th style={th}>{L("পরিশোধের তারিখ", "Paid on")}</th></tr></thead>
            <tbody>{rows.map((i, k) => { const [sl, sc] = st(i); const ps = (byInv[String(i._id)] || []).filter((p) => p.type !== "refund"); return <tr key={i._id} style={{ breakInside: "avoid" }}><td style={td}>{n(k + 1)}</td><td style={td}>{label(i)}</td><td style={td}>{x(i.title)}</td><td style={td}>{money(i.obligation)}</td><td style={td}>{money(i.paid)}</td><td style={{ ...td, fontWeight: 700, color: i.due > 0 ? "#b91c1c" : "#0f172a" }}>{money(Math.max(0, i.due))}</td><td style={{ ...td, fontWeight: 700, color: sc }}>{sl}</td><td style={{ ...td, fontSize: 10 }}>{ps.length ? ps.map((p) => date(p.date)).join(", ") : "—"}</td></tr>; })}
              {rows.length === 0 && <tr><td style={td} colSpan={8}>{L("কোনো ফি নেই", "No fees")}</td></tr>}
              {rows.length > 0 && <tr style={{ background: "#FBF0CC", fontWeight: 800 }}><td style={td} colSpan={3}>{L("সর্বমোট", "Total")}</td><td style={td}>{money(tot("obligation"))}</td><td style={td}>{money(tot("paid"))}</td><td style={{ ...td, color: "#b91c1c" }}>{money(dueRows.reduce((t, i) => t + i.due, 0))}</td><td style={td} colSpan={2} /></tr>}</tbody>
          </table>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, fontSize: 11.5 }}>
            <p style={{ border: "1px solid #F3C1C1", background: "#FEF2F2", borderRadius: 8, padding: 8, margin: 0 }}><b style={{ color: "#b91c1c" }}>{L("বকেয়া আছে", "Pending dues")} ({n(dueRows.length)}):</b> {dueRows.length ? dueRows.map((i) => `${label(i)}${i.period ? "" : ` ${x(i.title)}`}`).join(", ") : L("কোনো বকেয়া নেই", "No dues")}</p>
            <p style={{ border: "1px solid #BBD7CC", background: "#F0F7F4", borderRadius: 8, padding: 8, margin: 0 }}><b style={{ color: "#0A4435" }}>{L("পরিশোধ হয়েছে", "Paid")} ({n(paidRows.length)}):</b> {paidRows.length ? paidRows.map((i) => `${label(i)}${i.period ? "" : ` ${x(i.title)}`}`).join(", ") : "—"}</p>
          </div>
        </section>);
      })()}
      {pay && <section style={{ marginTop: 16 }}><h3 style={h3}>{L("পেমেন্ট ইতিহাস", "Payment history")}</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>#</th><th style={th}>{L("তারিখ", "Date")}</th><th style={th}>{L("ইনভয়েস নং", "Invoice no.")}</th><th style={th}>{L("খাত", "Item")}</th><th style={th}>{L("মাধ্যম", "Method")}</th><th style={th}>{L("টাকা", "Amount")}</th></tr></thead>
          <tbody>{payments.map((p, i) => <tr key={p._id} style={{ breakInside: "avoid" }}><td style={td}>{n(i + 1)}</td><td style={td}>{date(p.date)}</td><td style={td}>{p.receiptNo}</td><td style={td}>{p.invoice?.title ? x(p.invoice.title) : ""}{p.invoice?.period ? ` (${p.invoice.period})` : ""}{p.type === "refund" ? ` — ${L("রিফান্ড", "Refund")}` : ""}</td><td style={td}>{p.methodLabel || x(methodLabel[p.method])}</td><td style={{ ...td, fontWeight: 700 }}>{p.type === "refund" ? "−" : ""}{money(p.amount)}</td></tr>)}
            {payments.length === 0 && <tr><td style={td} colSpan={6}>{L("কোনো পেমেন্ট নেই", "No payments")}</td></tr>}
            {payments.length > 0 && <tr><td style={{ ...td, textAlign: "right", fontWeight: 700 }} colSpan={5}>{L("মোট জমা", "Total paid")}</td><td style={{ ...td, fontWeight: 800 }}>{money(total)}</td></tr>}
            {due !== undefined && <tr><td style={{ ...td, textAlign: "right", fontWeight: 700 }} colSpan={5}>{L("বকেয়া ফি", "Balance due")}</td><td style={{ ...td, fontWeight: 800, color: due > 0 ? "#b91c1c" : "#0A4435" }}>{money(due)}</td></tr>}</tbody>
        </table></section>}
    </A4Doc>
  );
}
