"use client";
import { useEffect, useState } from "react";
import A4Doc from "@/components/A4Doc";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";

// সাধারণ তালিকা প্রিন্ট (লোগো-ঠিকানাসহ A4): যেকোনো পেজের "তালিকা প্রিন্ট" বাটন এটি ব্যবহার করে
export default function Page() {
  const { x, n, lang } = useLang(); const [d, setD] = useState(undefined);
  useEffect(() => { try { setD(JSON.parse(sessionStorage.getItem("printList") || "null")); } catch { setD(null); } }, []);
  if (d === undefined) return <Loader compact label={x("লোড হচ্ছে...")} />;
  if (!d) return <p className="rounded-lg bg-amber-50 p-4 text-amber-900">{x("প্রিন্ট করার মতো তালিকা পাওয়া যায়নি")}</p>;
  const B = "1px solid #334155", th = { border: B, background: "#E5E7EB", color: "#0A4435", padding: "6px 4px", fontSize: 10.5, textAlign: "center", fontWeight: 700 }, td = { border: B, padding: "4px 4px", fontSize: 10.5, textAlign: "center" };
  return (
    <A4Doc title={d.title} docTitle={d.title} code={lang === "en" ? `Total ${d.total}` : `মোট ${n(d.total)} টি`}>
      {d.sub && <p style={{ textAlign: "center", fontSize: 12, marginBottom: 8 }}>{d.sub}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={{ ...th, width: 26 }}>#</th>{d.head.map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{d.rows.map((r, i) => <tr key={i} style={{ breakInside: "avoid" }}><td style={td}>{n(i + 1)}</td>{r.map((c, j) => <td key={j} style={{ ...td, textAlign: j === 0 ? "left" : "center" }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </A4Doc>
  );
}
