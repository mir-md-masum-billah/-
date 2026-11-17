"use client";
import A4Doc from "./A4Doc";
import { bnDate } from "@/lib/school";
import { fmtTime } from "./AdmitCardView";
import { useLang } from "@/components/LangProvider";

const DAYN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const B = "1px solid #334155";
const th = { border: B, background: "#E5E7EB", color: "#0A4435", padding: "7px 6px", fontSize: 11, textAlign: "center", fontWeight: 700 };
const td = { border: B, padding: "7px 6px", textAlign: "center", fontSize: 12 };

// চৌকো ঘরের পরীক্ষার রুটিন-টেবিল (একটি নোটিশের জন্য)
export function ExamTable({ exam }) {
  const { x } = useLang();
  const rows = [...exam.schedule].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const day = (d) => x(DAYN[new Date(d + "T00:00:00Z").getUTCDay()]);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
      <thead><tr><th style={{ ...th, width: 34 }}>#</th><th style={th}>{x("তারিখ")}</th><th style={th}>{x("বার")}</th><th style={th}>{x("বিষয়")}</th><th style={th}>{x("সময়")}</th></tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} style={{ breakInside: "avoid" }}><td style={td}>{i + 1}</td><td style={td}>{bnDate(r.date)}</td><td style={td}>{day(r.date)}</td><td style={{ ...td, fontWeight: 700 }}>{x(r.subject)}</td><td style={td}>{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</td></tr>)}</tbody>
    </table>
  );
}

// পরীক্ষার নোটিশ/রুটিনের A4 নথি (পাবলিক পেজ ও অ্যাডমিন — দুই জায়গায়)
export default function ExamNoticeDoc({ exam, school, back }) {
  const { x, money } = useLang();
  return (
    <A4Doc school={school} back={back} title={x("পরীক্ষার নোটিশ ও রুটিন")} filename={`exam-${exam.name}-${exam.class}${exam.section || ""}`} code={exam.createdAt ? bnDate(exam.createdAt.slice(0, 10)) : ""}>
      <p style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#0A4435" }}>{exam.name}{exam.session ? ` — ${exam.session}` : ""}</p>
      <p style={{ textAlign: "center", marginTop: 2 }}>{x("শ্রেণি")}: <b>{x(exam.class)}</b>{exam.section ? <> · {x("শাখা")}: <b>{exam.section}</b></> : ` · ${x("সব শাখা")}`}</p>
      <ExamTable exam={exam} />
      {exam.fee > 0 && <p style={{ marginTop: 14 }}>{x("পরীক্ষার ফি")}: <b>{money(exam.fee)}</b> — শিক্ষার্থীর অ্যাকাউন্টে লগইন করে অনলাইনে পরিশোধ করা যাবে। ফি অনুমোদনের পর প্রবেশপত্র পাওয়া যাবে।</p>}
      {exam.instructions && <section style={{ marginTop: 14 }}><h3 style={{ fontSize: 12, fontWeight: 700, color: "#9A7623", marginBottom: 4 }}>{x("নির্দেশনা")}</h3><p style={{ whiteSpace: "pre-line" }}>{exam.instructions}</p></section>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 70, fontSize: 11 }}><span style={{ borderTop: "1px solid #64748b", padding: "3px 28px" }}>{x("প্রধান শিক্ষকের স্বাক্ষর")}</span></div>
    </A4Doc>
  );
}

// সব শ্রেণির পরীক্ষার রুটিন একসাথে — একটি নথিতে শ্রেণি ধরে সাজানো
export function AllExamsDoc({ exams, school, back }) {
  const { x } = useLang();
  return (
    <A4Doc school={school} back={back} title={x("সব শ্রেণির পরীক্ষার রুটিন")} filename="exam-routine-all-classes" code="">
      {exams.map((e) => (
        <section key={e._id} style={{ marginBottom: 18, breakInside: "avoid" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0A4435" }}>{e.name}{e.session ? ` — ${e.session}` : ""} · {x("শ্রেণি")}: {x(e.class)}{e.section ? ` (${e.section})` : ` · ${x("সব শাখা")}`}</p>
          <ExamTable exam={e} />
        </section>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40, fontSize: 11 }}><span style={{ borderTop: "1px solid #64748b", padding: "3px 28px" }}>{x("প্রধান শিক্ষকের স্বাক্ষর")}</span></div>
    </A4Doc>
  );
}
