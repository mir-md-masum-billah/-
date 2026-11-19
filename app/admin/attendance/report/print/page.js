"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import A4Doc from "@/components/A4Doc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";
import { months } from "@/lib/school";

// হাজিরা রিপোর্টের A4 প্রিন্ট — বাকি সব প্রিন্টের মতো লোগো, স্কুলের নাম, ঠিকানা সহ; ভাষা অনুযায়ী বাংলা/English
// ?type=student|staff|absent &cls= &section= &mode=month|year &month=YYYY-MM &year=YYYY &date=YYYY-MM-DD
export default function Page() {
  const { x, n, lang, date: fmtDate } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const [d, setD] = useState(null); const [err, setErr] = useState(""); const [q, setQ] = useState(null);
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const p = { type: sp.get("type") || "student", cls: sp.get("cls") || "", section: sp.get("section") || "", mode: sp.get("mode") || "month", month: sp.get("month") || "", year: sp.get("year") || "", date: sp.get("date") || "" };
    setQ(p);
    const api_q = p.type === "absent" ? `type=absent&date=${p.date}&class=${encodeURIComponent(p.cls)}` : `type=${p.type}${p.type === "student" ? `&class=${encodeURIComponent(p.cls)}${p.section ? "&section=" + encodeURIComponent(p.section) : ""}` : ""}&${p.mode === "year" ? "year=" + p.year : "month=" + p.month}`;
    api("GET", `/api/reports/attendance?${api_q}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("রিপোর্ট আনা যায়নি"))));
  }, []); // eslint-disable-line
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d || !q) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const P = (v) => (v === null || v === undefined ? "—" : n(v) + "%");
  const yr = (y) => (/^\d+$/.test(String(y)) ? n(Number(y)).replace(/[,،]/g, "") : y);
  const period = q.type === "absent" ? fmtDate(q.date) : q.mode === "year" ? L(`${yr(q.year)} সাল`, `Year ${q.year}`) : `${x(months[Number(q.month.slice(5)) - 1])} ${yr(q.month.slice(0, 4))}`;
  const who = q.type === "staff" ? L("স্টাফ", "Staff") : L("শিক্ষার্থী", "Student");
  const title = q.type === "absent" ? L("অনুপস্থিতের তালিকা", "Absentee List") : L(`${who} হাজিরা রিপোর্ট`, `${who} Attendance Report`);
  const sub = [q.type !== "staff" && q.cls && `${L("শ্রেণি", "Class")}: ${x(q.cls)}${q.type === "student" && q.section ? ` (${q.section})` : ""}`, `${q.type === "absent" ? L("তারিখ", "Date") : L("সময়কাল", "Period")}: ${period}`].filter(Boolean).join("   |   ");
  const rows = d.rows || [];
  const B = "1px solid #334155", th = { border: B, background: "#E5E7EB", color: "#0A4435", padding: "6px 3px", fontSize: 10.5, textAlign: "center", fontWeight: 700 }, td = { border: B, padding: "5px 3px", fontSize: 11, textAlign: "center" };
  const sum = (k) => rows.reduce((t, r) => t + (r[k] || 0), 0);
  const avg = rows.filter((r) => r.pct !== null && r.pct !== undefined);
  const avgPct = avg.length ? Math.round((avg.reduce((t, r) => t + r.pct, 0) / avg.length) * 10) / 10 : null;
  const withMonths = q.mode === "year" && q.type === "student";
  return (
    <A4Doc title={title} docTitle={[title, q.type !== "staff" && q.cls && `${L("শ্রেণি", "Class")} ${x(q.cls)}${q.section ? ` ${q.section}` : ""}`, period].filter(Boolean).join(" - ")} code={L(`মোট ${n(q.type === "absent" ? d.items.length : rows.length)} জন`, `Total ${q.type === "absent" ? d.items.length : rows.length}`)}
      back={<Link href="/admin/attendance/report" className="btn-ghost !py-2">{x("← হাজিরা রিপোর্ট")}</Link>}>
      <p style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#0A4435", marginBottom: 10 }}>{sub}</p>
      {q.type === "absent" ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, width: 30 }}>#</th>{[L("শ্রেণি", "Class"), L("রোল", "Roll"), L("নাম", "Name"), L("অভিভাবকের ফোন", "Guardian phone")].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{d.items.map((i, k) => <tr key={i._id} style={{ breakInside: "avoid" }}><td style={td}>{n(k + 1)}</td><td style={td}>{x(i.student.class)}</td><td style={td}>{n(i.student.roll)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{i.student.name}</td><td style={td}>{i.student.guardianPhone || i.student.phone || "—"}</td></tr>)}
            {d.items.length === 0 && <tr><td style={td} colSpan={5}>{L("এই দিনে কেউ অনুপস্থিত নেই (বা হাজিরা নেওয়া হয়নি)", "Nobody was absent (or attendance was not taken)")}</td></tr>}</tbody>
        </table>
      ) : (<>
        <p style={{ fontSize: 10.5, color: "#475569", marginBottom: 6 }}>{L(`এই সময়ে ${n(d.days)} দিনের হাজিরা নেওয়া হয়েছে। হার = (উপস্থিত+দেরি) ÷ (উপস্থিত+দেরি+অনুপস্থিত); ছুটি/হলিডে/অচিহ্নিত হারে ধরা হয় না।`, `Attendance was taken on ${d.days} day(s) in this period. Rate = (present + late) ÷ (present + late + absent); leave, holidays and unmarked days are not counted.`)}</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ ...th, width: 26 }}>#</th>{q.type === "student" && <th style={th}>{L("রোল", "Roll")}</th>}<th style={th}>{L("নাম", "Name")}</th>{[L("উপস্থিত", "Present"), L("অনুপস্থিত", "Absent"), L("দেরি", "Late"), L("ছুটি", "Leave"), L("হলিডে", "Holiday"), L("অচিহ্নিত", "Unmarked"), L("হার", "Rate")].map((h) => <th key={h} style={th}>{h}</th>)}{withMonths && months.map((m) => <th key={m} style={{ ...th, fontSize: 9 }}>{x(m).slice(0, 3)}</th>)}</tr></thead>
          <tbody>{rows.map((r, k) => <tr key={(r.student || r.person)._id} style={{ breakInside: "avoid" }}><td style={td}>{n(k + 1)}</td>{q.type === "student" && <td style={td}>{n(r.student.roll)}</td>}<td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{(r.student || r.person).name}</td><td style={td}>{n(r.present)}</td><td style={{ ...td, color: r.absent ? "#b91c1c" : undefined, fontWeight: r.absent ? 700 : 400 }}>{n(r.absent)}</td><td style={td}>{n(r.late)}</td><td style={td}>{n(r.leave)}</td><td style={td}>{n(r.holiday)}</td><td style={td}>{n(r.unmarked)}</td><td style={{ ...td, fontWeight: 800 }}>{P(r.pct)}</td>{withMonths && (r.months || []).map((m, i) => <td key={i} style={{ ...td, fontSize: 9 }}>{m === null ? "—" : n(m)}</td>)}</tr>)}
            {rows.length === 0 && <tr><td style={td} colSpan={12}>{L("তথ্য নেই", "No data")}</td></tr>}
            {rows.length > 0 && <tr style={{ background: "#FBF0CC", fontWeight: 800 }}><td style={td} /><td style={{ ...td, textAlign: "right" }} colSpan={q.type === "student" ? 2 : 1}>{L("মোট / গড়", "Total / Avg")}</td>{["present", "absent", "late", "leave", "holiday", "unmarked"].map((k) => <td key={k} style={td}>{n(sum(k))}</td>)}<td style={td}>{P(avgPct)}</td>{withMonths && months.map((m) => <td key={m} style={td} />)}</tr>}</tbody>
        </table></>)}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48, fontSize: 11 }}>
        <span style={{ borderTop: "1px solid #64748b", padding: "3px 24px" }}>{L("ক্লাস টিচার", "Class teacher")}</span><span style={{ borderTop: "1px solid #64748b", padding: "3px 24px" }}>{L("প্রধান শিক্ষক", "Head teacher")}</span>
      </div>
    </A4Doc>
  );
}
