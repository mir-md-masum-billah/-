"use client";
import A4Doc from "./A4Doc";
import { fmtTime } from "./AdmitCardView";
import { DAYS } from "@/lib/routine-days";
import { useLang } from "./LangProvider";

// সাপ্তাহিক ক্লাস রুটিন — চৌকো ঘরের গ্রিড: বামে বার, উপরে সময়, প্রতিটি ঘরে বিষয় + (শ্রেণি/শিক্ষক)
// mode "teacher": ঘরে শ্রেণি দেখায়; mode "student": শিক্ষকের নাম দেখায়
export default function RoutineSheet({ items, mode, heading, filename, code }) {
  const { x } = useLang();
  const B = "1px solid #334155";
  const th = { border: B, background: "#E5E7EB", color: "#0A4435", padding: "6px 4px", fontSize: 11, textAlign: "center", fontWeight: 700 };
  const td = { border: B, padding: "6px 4px", textAlign: "center", verticalAlign: "middle", fontSize: 11.5, lineHeight: 1.35 };
  const slots = [...new Map(items.map((i) => [`${i.startTime}-${i.endTime}`, { s: i.startTime, e: i.endTime }])).values()].sort((a, b) => a.s.localeCompare(b.s) || a.e.localeCompare(b.e));
  const days = DAYS.map((name, d) => ({ d, name })).filter(({ d }) => items.some((i) => i.day === d));
  const cell = (d, sl) => items.filter((i) => i.day === d && i.startTime === sl.s && i.endTime === sl.e);
  return (
    <A4Doc title={x("সাপ্তাহিক ক্লাস রুটিন")} docTitle={[x("সাপ্তাহিক ক্লাস রুটিন"), heading].filter(Boolean).join(" - ")} code={code}>
      <p style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "#0A4435", marginBottom: 12 }}>{heading}</p>
      {items.length === 0 ? <p style={{ textAlign: "center", color: "#64748b" }}>{x("এখনও কোনো ক্লাস নির্ধারিত হয়নি")}</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr><th style={{ ...th, width: 64 }} rowSpan={2}>{x("বার")}</th><th style={th} colSpan={slots.length}>{x("সময় ও বিষয়")}</th></tr>
            <tr>{slots.map((sl) => <th key={sl.s + sl.e} style={{ ...th, fontWeight: 600, fontSize: 10 }}>{fmtTime(sl.s)}<br />{fmtTime(sl.e)}</th>)}</tr>
          </thead>
          <tbody>{days.map(({ d, name }) => (
            <tr key={d} style={{ breakInside: "avoid", height: 52 }}>
              <td style={{ ...td, fontWeight: 700, color: "#0A4435", background: "#F3F4F6" }}>{x(name)}</td>
              {slots.map((sl) => { const c = cell(d, sl); return (
                <td key={sl.s + sl.e} style={td}>{c.length ? c.map((r) => <div key={r._id}><b>{x(r.subject)}</b><br /><span style={{ color: "#475569", fontSize: 10.5 }}>{mode === "teacher" ? `${x(r.class)}${r.section ? ` (${r.section})` : ""}` : (typeof r.teacher === "object" ? r.teacher?.name : r.teacher) || ""}</span></div>) : "—"}</td>
              ); })}
            </tr>
          ))}</tbody>
        </table>
      )}
    </A4Doc>
  );
}
