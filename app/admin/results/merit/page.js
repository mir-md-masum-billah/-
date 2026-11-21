"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import A4Doc from "@/components/A4Doc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";
import { useBlankCols } from "@/components/BlankCols";

// মেধা তালিকা (১ম, ২য়, ৩য়...) — ফল প্রকাশের পর শ্রেণিভিত্তিক প্রিন্ট। ?class=&section=&exam=&year=
export default function Page() {
  const { x, n, lang } = useLang(); const L = (bn, en) => (lang === "en" ? en : bn);
  const [d, setD] = useState(null); const [err, setErr] = useState(""); const [q, setQ] = useState(null); const bc = useBlankCols();
  useEffect(() => { const sp = new URLSearchParams(location.search); const p = { cls: sp.get("class") || "", section: sp.get("section") || "", exam: sp.get("exam") || "", year: sp.get("year") || "" }; setQ(p);
    api("GET", `/api/results/merit?class=${encodeURIComponent(p.cls)}&section=${encodeURIComponent(p.section)}&exam=${encodeURIComponent(p.exam)}&year=${p.year}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("লোড করা যায়নি")))); }, []); // eslint-disable-line
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d || !q) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const yr = n(Number(q.year)).replace(/[,،]/g, "");
  const B = "1px solid #334155", th = { border: B, background: "#E5E7EB", color: "#0A4435", padding: "6px 4px", fontSize: 11, textAlign: "center", fontWeight: 700 }, td = { border: B, padding: "5px 4px", fontSize: 11.5, textAlign: "center" };
  const ord = (p) => (lang === "en" ? `${p}${[, "st", "nd", "rd"][p % 10 > 3 || [11, 12, 13].includes(p % 100) ? 0 : p % 10] || "th"}` : n(p));
  const title = L("মেধা তালিকা", "Merit List");
  return (
    <A4Doc title={title} docTitle={[title, `${L("শ্রেণি", "Class")} ${x(q.cls)}${q.section ? ` ${q.section}` : ""}`, q.exam, q.year].join(" - ")} code={L(`মোট ${n(d.items.length)} জন`, `Total ${d.items.length}`)} back={<><Link href="/admin/results" className="btn-ghost !py-2">{x("← ফলাফল")}</Link>{bc.ui}</>}>
      <p style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#0A4435", marginBottom: 10 }}>{L("শ্রেণি", "Class")}: {x(q.cls)}{q.section ? ` (${q.section})` : ""}   |   {q.exam} — {yr}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{[L("মেধাক্রম", "Position"), L("রোল", "Roll"), L("নাম", "Name"), L("আইডি", "ID"), L("মোট নম্বর", "Total"), L("শতকরা", "%"), L("জিপিএ", "GPA"), L("গ্রেড", "Grade"), L("ফল", "Result")].map((h) => <th key={h} style={th}>{h}</th>)}{bc.ths(th)}</tr></thead>
        <tbody>{d.items.map((r) => <tr key={r._id} style={{ breakInside: "avoid", background: r.position <= 3 && r.passed ? "#FBF0CC" : undefined }}>
          <td style={{ ...td, fontWeight: 800, color: "#0A4435" }}>{ord(r.position)}</td><td style={td}>{n(r.roll)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{r.name}{r.section ? ` (${r.section})` : ""}</td><td style={td}>{r.studentId}</td>
          <td style={td}>{n(r.total)} / {n(r.full)}</td><td style={td}>{n(r.percent)}%</td><td style={td}>{n(r.gpa.toFixed(2))}</td><td style={{ ...td, fontWeight: 800, color: r.passed ? "#0A4435" : "#b91c1c" }}>{r.letter}</td><td style={{ ...td, color: r.passed ? "#0A4435" : "#b91c1c" }}>{r.passed ? L("উত্তীর্ণ", "Pass") : L("অনুত্তীর্ণ", "Fail")}</td>{bc.tds(td)}</tr>)}
          {d.items.length === 0 && <tr><td style={td} colSpan={9}>{L("এই পরীক্ষার কোনো ফল নেই", "No results for this exam")}</td></tr>}</tbody>
      </table>
      <p style={{ fontSize: 10, color: "#64748b", marginTop: 8 }}>{L("মেধাক্রম: উত্তীর্ণরা আগে, তারপর মোট নম্বর ও জিপিএ অনুযায়ী। গ্রেড: A+ (৮০+), A (৭০+), A- (৬০+), B (৫০+), C (৪০+), D (৩৩+), F।", "Position: passed students first, then by total marks and GPA. Grades: A+ (80+), A (70+), A- (60+), B (50+), C (40+), D (33+), F.")}</p>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, fontSize: 11 }}><span style={{ borderTop: "1px solid #64748b", padding: "3px 24px" }}>{L("ক্লাস টিচার", "Class teacher")}</span><span style={{ borderTop: "1px solid #64748b", padding: "3px 24px" }}>{L("প্রধান শিক্ষক", "Head teacher")}</span></div>
    </A4Doc>
  );
}
