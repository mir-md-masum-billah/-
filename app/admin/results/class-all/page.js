"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import A4Doc from "@/components/A4Doc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";
import { useBlankCols } from "@/components/BlankCols";

// একটি শ্রেণির সবগুলো পরীক্ষার ফল এক তালিকায়। ?class=&section=&year=
export default function Page() {
  const { x, n, lang } = useLang(); const L = (bn, en) => (lang === "en" ? en : bn);
  const [d, setD] = useState(null); const [err, setErr] = useState(""); const [q, setQ] = useState(null); const bc = useBlankCols();
  useEffect(() => { const sp = new URLSearchParams(location.search); const p = { cls: sp.get("class") || "", section: sp.get("section") || "", year: sp.get("year") || "" }; setQ(p);
    api("GET", `/api/results/class-all?class=${encodeURIComponent(p.cls)}&section=${encodeURIComponent(p.section)}&year=${p.year}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("লোড করা যায়নি")))); }, []); // eslint-disable-line
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d || !q) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const yr = n(Number(q.year)).replace(/[,،]/g, "");
  const B = "1px solid #334155", th = { border: B, background: "#E5E7EB", color: "#0A4435", padding: "5px 3px", fontSize: 10, textAlign: "center", fontWeight: 700 }, td = { border: B, padding: "4px 3px", fontSize: 10.5, textAlign: "center" };
  const title = L("সব পরীক্ষার সম্মিলিত ফলাফল", "Combined Results of All Exams");
  return (
    <A4Doc title={title} docTitle={[title, `${L("শ্রেণি", "Class")} ${x(q.cls)}${q.section ? ` ${q.section}` : ""}`, q.year].join(" - ")} code={L(`মোট ${n(d.items.length)} জন`, `Total ${d.items.length}`)} back={<><Link href="/admin/results" className="btn-ghost !py-2">{x("← ফলাফল")}</Link>{bc.ui}</>}>
      <p style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#0A4435", marginBottom: 10 }}>{L("শ্রেণি", "Class")}: {x(q.cls)}{q.section ? ` (${q.section})` : ""}   |   {L("শিক্ষাবর্ষ", "Year")} {yr}</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th} rowSpan={2}>{L("মেধা", "Pos.")}</th><th style={th} rowSpan={2}>{L("রোল", "Roll")}</th><th style={th} rowSpan={2}>{L("নাম", "Name")}</th>{d.exams.map((e) => <th key={e} style={th} colSpan={2}>{e}</th>)}<th style={th} rowSpan={2}>{L("গড় %", "Avg %")}</th><th style={th} rowSpan={2}>{L("গ্রেড", "Grade")}</th>{bc.ths(th, 2)}</tr>
          <tr>{d.exams.map((e) => [<th key={e + "t"} style={th}>{L("মোট", "Total")}</th>, <th key={e + "g"} style={th}>{L("গ্রেড", "Gr.")}</th>])}</tr></thead>
        <tbody>{d.items.map((r) => <tr key={r._id} style={{ breakInside: "avoid" }}><td style={{ ...td, fontWeight: 800 }}>{n(r.position)}</td><td style={td}>{n(r.roll)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{r.name}</td>
          {r.per.map((p, i) => [<td key={i + "t"} style={td}>{p ? n(p.total) : "—"}</td>, <td key={i + "g"} style={{ ...td, fontWeight: 700, color: p && !p.passed ? "#b91c1c" : "#0A4435" }}>{p ? p.letter : "—"}</td>])}
          <td style={{ ...td, fontWeight: 700 }}>{n(r.avgPercent)}%</td><td style={{ ...td, fontWeight: 800, color: r.passed ? "#0A4435" : "#b91c1c" }}>{r.passed ? (r.avgPercent >= 80 ? "A+" : r.avgPercent >= 70 ? "A" : r.avgPercent >= 60 ? "A-" : r.avgPercent >= 50 ? "B" : r.avgPercent >= 40 ? "C" : "D") : "F"}</td>{bc.tds(td)}</tr>)}
          {d.items.length === 0 && <tr><td style={td} colSpan={5 + d.exams.length * 2}>{L("কোনো ফল নেই", "No results")}</td></tr>}</tbody>
      </table>
          </A4Doc>
  );
}
