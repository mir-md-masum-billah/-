"use client";
import { useEffect, useState } from "react";
import { api } from "./CrudPage";
import A4Doc, { Field } from "./A4Doc";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { bnDate } from "@/lib/school";

export const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ap}`; };

export default function AdmitCardView({ id }) {
  const { x, n, money } = useLang();
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/admit-cards/${id}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("অ্যাডমিট কার্ড পাওয়া যায়নি")))); }, [id]);
  if (err) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const { card, exam, student: s } = d;
  const th = { textAlign: "left", background: "#E8F1EC", color: "#0A4435", padding: "6px 8px", fontSize: 11, borderBottom: "2px solid #C49B3F" }, td = { padding: "6px 8px", borderBottom: "1px solid #e2e8f0" };
  return (
    <A4Doc title="প্রবেশপত্র" titleEn="Admit Card" filename={`admit-${s.studentId}-${exam.name}`} code={card.admitNo}>
      <p style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: "#0A4435" }}>{exam.name}{exam.session ? ` — ${exam.session}` : ""}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 118px", gap: 18, marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 20px", alignContent: "start" }}>
          <Field l="শিক্ষার্থীর নাম" en="Name" className="col-span-2">{s.name}</Field>
          <Field l="আইডি" en="Student ID">{s.studentId}</Field><Field l="রোল নম্বর" en="Roll">{n(card.roll ?? s.roll)}</Field>
          <Field l="শ্রেণি" en="Class">{x(card.class || s.class)}</Field><Field l="শাখা" en="Section">{card.section || s.section}</Field>
          <Field l="প্রবেশপত্র নং" en="Admit No" className="col-span-2">{card.admitNo}</Field>
        </div>
        <div style={{ width: 118, height: 142, border: "1.5px solid #C49B3F", borderRadius: 4, display: "grid", placeItems: "center", overflow: "hidden", background: "#f8fafc" }}>
          {s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>ছবি<br />Photo</span>}
        </div>
      </div>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", margin: "18px 0 6px" }}>পরীক্ষার সূচি · Exam schedule</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>তারিখ / Date</th><th style={th}>বিষয় / Subject</th><th style={th}>সময় / Time</th></tr></thead>
        <tbody>{[...exam.schedule].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map((r, i) => <tr key={i}><td style={td}>{bnDate(r.date)}</td><td style={{ ...td, fontWeight: 600 }}>{x(r.subject)}</td><td style={td}>{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</td></tr>)}</tbody>
      </table>
      {exam.instructions && <section style={{ marginTop: 14 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 4 }}>নির্দেশনা · Instructions</h3><p style={{ whiteSpace: "pre-line", fontSize: 12 }}>{exam.instructions}</p></section>}
      <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 11, color: "#475569", listStyle: "disc" }}><li>প্রবেশপত্র ছাড়া পরীক্ষার হলে প্রবেশ করা যাবে না।</li><li>পরীক্ষা শুরুর অন্তত ১৫ মিনিট আগে উপস্থিত হতে হবে।</li></ul>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64, fontSize: 11 }}>
        <span style={{ borderTop: "1px solid #64748b", padding: "3px 22px" }}>শ্রেণি শিক্ষকের স্বাক্ষর</span>
        <span style={{ borderTop: "1px solid #64748b", padding: "3px 22px" }}>প্রধান শিক্ষকের স্বাক্ষর</span>
      </div>
    </A4Doc>
  );
}
