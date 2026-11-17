"use client";
import A4Doc from "./A4Doc";
import { fmtTime } from "./AdmitCardView";
import { DAYS } from "@/lib/routine-days";
import { useLang } from "./LangProvider";

// সাপ্তাহিক ক্লাস রুটিন — শিক্ষক ও শিক্ষার্থী দুজনের জন্য একই সুন্দর টেবিল (A4 PDF/প্রিন্ট সহ)
// mode "teacher": প্রতিটি সারিতে শ্রেণি দেখায়; mode "student": শিক্ষকের নাম দেখায়
export default function RoutineSheet({ items, mode, heading, filename, code }) {
  const { x } = useLang();
  const th = { textAlign: "left", background: "#E8F1EC", color: "#0A4435", padding: "7px 8px", fontSize: 11, borderBottom: "2px solid #C49B3F" }, td = { padding: "7px 8px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" };
  const order = [0, 1, 2, 3, 4, 5, 6];
  const byDay = order.map((d) => ({ d, rows: items.filter((i) => i.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime)) }));
  return (
    <A4Doc title="সাপ্তাহিক ক্লাস রুটিন" titleEn="Weekly Class Routine" filename={filename} code={code}>
      <p style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "#0A4435", marginBottom: 12 }}>{heading}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={{ ...th, width: 90 }}>দিন</th><th style={th}>ক্লাসসমূহ (সময় — বিষয় — {mode === "teacher" ? "শ্রেণি" : "শিক্ষক"})</th></tr></thead>
        <tbody>{byDay.filter((b) => b.rows.length).map((b) => <tr key={b.d} style={{ breakInside: "avoid" }}><td style={{ ...td, fontWeight: 700, color: "#0A4435" }}>{DAYS[b.d]}</td>
          <td style={td}>{b.rows.map((r) => <div key={r._id} style={{ display: "flex", gap: 10, padding: "3px 0", borderBottom: "1px dashed #e2e8f0" }}><span style={{ width: 150, color: "#9A7623", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</span><span style={{ fontWeight: 600, flex: 1 }}>{x(r.subject)}</span><span style={{ color: "#475569" }}>{mode === "teacher" ? `${x(r.class)}${r.section ? ` (${r.section})` : ""}` : r.teacher}</span></div>)}</td></tr>)}
          {items.length === 0 && <tr><td style={{ ...td, textAlign: "center", color: "#64748b" }} colSpan={2}>এখনও কোনো ক্লাস নির্ধারিত হয়নি</td></tr>}</tbody>
      </table>
    </A4Doc>
  );
}
