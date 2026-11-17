"use client";
import A4Doc from "./A4Doc";
import { bnDate } from "@/lib/school";
import { fmtTime } from "./AdmitCardView";
import { useLang } from "@/components/LangProvider";

// পরীক্ষার নোটিশ/রুটিনের A4 নথি (পাবলিক পেজ ও অ্যাডমিন — দুই জায়গায়)
export default function ExamNoticeDoc({ exam, school, back }) {
  const { x, money } = useLang();
  const th = { textAlign: "left", background: "#E8F1EC", color: "#0A4435", padding: "7px 8px", fontSize: 11, borderBottom: "2px solid #C49B3F" }, td = { padding: "7px 8px", borderBottom: "1px solid #e2e8f0" };
  const rows = [...exam.schedule].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const day = (d) => ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"][new Date(d + "T00:00:00Z").getUTCDay()];
  return (
    <A4Doc school={school} back={back} title="পরীক্ষার নোটিশ ও রুটিন" titleEn="Exam Notice & Routine" filename={`exam-${exam.name}-${exam.class}${exam.section || ""}`} code={exam.createdAt ? bnDate(exam.createdAt.slice(0, 10)) : ""}>
      <p style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#0A4435" }}>{exam.name}{exam.session ? ` — ${exam.session}` : ""}</p>
      <p style={{ textAlign: "center", marginTop: 2 }}>শ্রেণি: <b>{x(exam.class)}</b>{exam.section ? <> · শাখা: <b>{exam.section}</b></> : " · সকল শাখা"}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead><tr><th style={th}>#</th><th style={th}>তারিখ</th><th style={th}>বার</th><th style={th}>বিষয়</th><th style={th}>সময়</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td style={td}>{i + 1}</td><td style={td}>{bnDate(r.date)}</td><td style={td}>{day(r.date)}</td><td style={{ ...td, fontWeight: 600 }}>{x(r.subject)}</td><td style={td}>{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</td></tr>)}</tbody>
      </table>
      {exam.fee > 0 && <p style={{ marginTop: 14 }}>পরীক্ষার ফি: <b>{money(exam.fee)}</b> — শিক্ষার্থীর অ্যাকাউন্টে লগইন করে অনলাইনে পরিশোধ করা যাবে। ফি অনুমোদনের পর প্রবেশপত্র পাওয়া যাবে।</p>}
      {exam.instructions && <section style={{ marginTop: 14 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 4 }}>নির্দেশনা</h3><p style={{ whiteSpace: "pre-line" }}>{exam.instructions}</p></section>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 70, fontSize: 11 }}><span style={{ borderTop: "1px solid #64748b", padding: "3px 28px" }}>প্রধান শিক্ষকের স্বাক্ষর</span></div>
    </A4Doc>
  );
}
