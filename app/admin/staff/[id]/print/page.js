"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import A4Doc, { Field } from "@/components/A4Doc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";
import { roleLabel } from "@/lib/rbac";
import { DAYS } from "@/lib/routine-days";

// শিক্ষক/স্টাফ প্রোফাইল A4 প্রিন্ট (ভাষা অনুযায়ী)
export default function Page({ params }) {
  const { id } = use(params); const { x, n, money, date, lang } = useLang(); const L = (bn, en) => (lang === "en" ? en : bn);
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/staff/${id}/profile`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("লোড করা যায়নি")))); }, [id]); // eslint-disable-line
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const t = d.staff, a = d.attendance, B = "1px solid #334155", th = { border: B, background: "#E5E7EB", padding: "5px", fontSize: 11, textAlign: "center" }, td = { border: B, padding: "5px", fontSize: 11, textAlign: "center" };
  const h3 = { fontSize: 12, fontWeight: 700, color: "#9A7623", margin: "14px 0 6px" };
  return (
    <A4Doc title={L("শিক্ষক / স্টাফ প্রোফাইল", "Teacher / Staff Profile")} docTitle={`${t.name} - ${t.userId} - ${L("শিক্ষক প্রোফাইল", "Staff Profile")}`} code={t.userId} back={<Link href={`/admin/staff/${id}`} className="btn-ghost !py-2">{x("← প্রোফাইল")}</Link>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", alignContent: "start" }}>
          <Field l={L("নাম", "Name")} className="col-span-2">{t.name}</Field><Field l={L("আইডি", "ID")}>{t.userId}</Field><Field l={L("পদ", "Role")}>{x(roleLabel[t.role])}</Field>
          <Field l={L("পদবি", "Designation")}>{t.designation}</Field><Field l={L("বিভাগ", "Department")}>{t.department}</Field><Field l={L("বিষয়", "Subject")}>{t.subject}</Field><Field l={L("মোবাইল", "Phone")}>{t.phone}</Field>
          <Field l={L("যোগদান", "Joining date")}>{t.joiningDate && date(t.joiningDate)}</Field>{t.salary !== undefined && <Field l={L("মাসিক বেতন", "Monthly salary")}>{money(t.salary || 0)}</Field>}
        </div>
        <div style={{ width: 110, height: 130, border: "1.5px solid #C49B3F", borderRadius: 4, overflow: "hidden", display: "grid", placeItems: "center", background: "#f8fafc" }}>{t.photo ? <img src={t.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#94a3b8" }}>{L("ছবি", "Photo")}</span>}</div>
      </div>
      <h3 style={h3}>{L("নিয়োগ", "Assignments")}</h3>
      <p style={{ fontSize: 12 }}>{d.assignments.length ? d.assignments.map((q) => q.kind === "class" ? `${L("ক্লাস টিচার", "Class teacher")}: ${x(q.class)}${q.section ? ` (${q.section})` : ""}` : `${x(q.class)}${q.section ? ` (${q.section})` : ""} — ${q.subject ? x(q.subject) : ""}`).join("  |  ") : "—"}</p>
      <h3 style={h3}>{L("হাজিরা (এ বছর)", "Attendance (this year)")}</h3>
      <p style={{ fontSize: 12 }}>{L("উপস্থিত", "Present")} {n(a.year.present + a.year.late)} · {L("অনুপস্থিত", "Absent")} {n(a.year.absent)} · {L("ছুটি", "Leave")} {n(a.year.leave)} · {L("হার", "Rate")} {a.year.pct === null ? "—" : n(a.year.pct) + "%"}</p>
      <h3 style={h3}>{L("সাপ্তাহিক রুটিন", "Weekly routine")}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>{L("দিন", "Day")}</th><th style={th}>{L("সময়", "Time")}</th><th style={th}>{L("শ্রেণি", "Class")}</th><th style={th}>{L("বিষয়", "Subject")}</th></tr></thead>
        <tbody>{d.routine.map((r, i) => <tr key={i} style={{ breakInside: "avoid" }}><td style={td}>{x(DAYS[r.day])}</td><td style={td}>{r.startTime}–{r.endTime}</td><td style={td}>{x(r.class)}{r.section ? ` (${r.section})` : ""}</td><td style={td}>{x(r.subject)}</td></tr>)}{d.routine.length === 0 && <tr><td style={td} colSpan={4}>—</td></tr>}</tbody></table>
    </A4Doc>
  );
}
