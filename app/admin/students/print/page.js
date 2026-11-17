"use client";
import { useEffect, useState } from "react";
import A4Doc from "@/components/A4Doc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";
import { PRINT_COLS } from "@/components/StudentListPrint";

export default function Page() {
  const { x, n, date } = useLang();
  const [rows, setRows] = useState(null); const [cfg, setCfg] = useState(null);
  useEffect(() => {
    let c; try { c = JSON.parse(sessionStorage.getItem("stuPrint") || "null"); } catch { c = null; }
    if (!c) return setRows([]);
    setCfg(c);
    api("GET", `/api/students?limit=1000&active=true${c.cls ? `&class=${encodeURIComponent(c.cls)}` : ""}`).then((r) => { const set = new Set(c.ids); setRows(r.ok ? r.d.items.filter((s) => set.has(s._id)) : []); });
  }, []);
  if (!rows || !cfg) return rows ? <p className="p-6">{x("প্রথমে শিক্ষার্থী তালিকা থেকে প্রিন্ট বেছে নিন")}</p> : <Loader compact label={x("লোড হচ্ছে...")} />;
  const B = "1px solid #334155";
  const th = { border: B, background: "#E5E7EB", padding: "6px 4px", fontSize: 11, textAlign: "center" }, td = { border: B, padding: "6px 5px", fontSize: 11.5, textAlign: "center", height: 28 };
  const cols = PRINT_COLS.filter(([k]) => cfg.cols.includes(k));
  const val = (s, k) => k === "photo" ? (s.photo ? <img src={s.photo} alt="" style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 4 }} /> : "") : k === "gender" ? x({ male: "ছেলে", female: "মেয়ে", other: "অন্যান্য" }[s.gender] || "") : k === "dob" ? (s.dob ? date(s.dob) : "") : k === "roll" ? n(s.roll) : k === "section" ? s.section : s[k];
  return (
    <A4Doc title={`${x("শিক্ষার্থী তালিকা")} — ${cfg.cls ? x(cfg.cls) : x("সব শিক্ষার্থী")}`} filename={`students-${cfg.cls || "all"}`} code={x("মোট {0} জন", rows.length)}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={{ ...th, width: 30 }}>#</th><th style={th}>{x("নাম")}</th>{!cfg.cls && <th style={th}>{x("শ্রেণি")}</th>}{cols.map(([k, l]) => <th key={k} style={th}>{x(l)}</th>)}{cfg.blanks.map((b, i) => <th key={i} style={th}>{b}</th>)}</tr></thead>
        <tbody>{rows.map((s, i) => <tr key={s._id} style={{ breakInside: "avoid" }}><td style={td}>{n(i + 1)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{s.name}</td>{!cfg.cls && <td style={td}>{x(s.class)}</td>}{cols.map(([k]) => <td key={k} style={td}>{val(s, k)}</td>)}{cfg.blanks.map((_, j) => <td key={j} style={td} />)}</tr>)}</tbody>
      </table>
    </A4Doc>
  );
}
