"use client";
import { useState } from "react";
import { useLang } from "./LangProvider";

// তালিকা প্রিন্টে খালি কলাম (হাতে লেখার জন্য: স্বাক্ষর, মন্তব্য, উপস্থিতি ইত্যাদি)। অনেক মানুষের তালিকায় ব্যবহার হয়।
// ব্যবহার: const bc = useBlankCols(); → টুলবারে {bc.ui}, <thead> এ {bc.ths(thStyle)}, প্রতি সারিতে {bc.tds(tdStyle)}
export function useBlankCols() {
  const { lang } = useLang(); const [cols, setCols] = useState([]);
  const L = (bn, en) => (lang === "en" ? en : bn);
  const ui = (
    <span className="no-print inline-flex flex-wrap items-center gap-2">
      <button type="button" className="btn-ghost !py-2" disabled={cols.length >= 6} onClick={() => setCols([...cols, ""])}>+ {L("খালি কলাম", "Blank column")}</button>
      {cols.map((c, i) => <span key={i} className="inline-flex items-center gap-1"><input className="input !w-28 !py-1.5 text-sm" placeholder={L("কলামের নাম", "Column name")} value={c} onChange={(e) => setCols(cols.map((v, j) => (j === i ? e.target.value : v)))} /><button type="button" aria-label="remove" className="text-lg leading-none text-red-600" onClick={() => setCols(cols.filter((_, j) => j !== i))}>×</button></span>)}
    </span>
  );
  const ths = (style, rowSpan) => cols.map((c, i) => <th key={"bh" + i} rowSpan={rowSpan} style={{ ...style, minWidth: 64 }}>{c}</th>);
  const tds = (style) => cols.map((_, i) => <td key={"bd" + i} style={{ ...style, minWidth: 64, height: 24 }}>&nbsp;</td>);
  return { ui, ths, tds, count: cols.length };
}
