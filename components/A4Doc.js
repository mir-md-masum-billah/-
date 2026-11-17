"use client";
import { useEffect, useRef, useState } from "react";
import Crest from "./Crest";
import Icon from "./Icon";
import useSchool from "@/hooks/useSchool";
import { useLang } from "./LangProvider";

// A4 কাগজে ছাপার উপযোগী নথির কাঠামো: স্কুলের লোগো, বাংলা ও ইংরেজি নাম, ঠিকানা + "PDF ডাউনলোড" ও "প্রিন্ট"।
// PDF তৈরি হয় ব্রাউজারে দেখানো নথি থেকেই, তাই বাংলা যুক্তাক্ষর/ফন্ট ঠিক থাকে (প্রিন্টে একই নথি A4-এ ছাপা হয়)।
export async function downloadPdf(el, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  if (document.fonts?.ready) await document.fonts.ready;
  const prevZoom = el.style.zoom; el.style.zoom = "1";
  let canvas;
  try { canvas = await html2canvas(el, { scale: 2.2, backgroundColor: "#ffffff", useCORS: true, logging: false, onclone: (doc) => { const st = doc.createElement("style"); st.textContent = ".a4-sheet, .a4-sheet * { text-rendering: auto !important; font-kerning: normal; letter-spacing: normal !important; word-spacing: normal !important; font-variant-ligatures: normal; }"; doc.head.appendChild(st); } }); } finally { el.style.zoom = prevZoom; }
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210, H = 297, pageH = Math.floor((canvas.width * H) / W);
  for (let y = 0, p = 0; y < canvas.height - 6; y += pageH, p++) { // ৬px সহনশীলতা: গোলাকরণে ফাঁকা দ্বিতীয় পাতা যেন না আসে
    const part = document.createElement("canvas"); part.width = canvas.width; part.height = Math.min(pageH, canvas.height - y);
    part.getContext("2d").drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
    if (p) pdf.addPage();
    pdf.addImage(part.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, W, (part.height * W) / canvas.width);
  }
  pdf.save(filename.endsWith(".pdf") ? filename : filename + ".pdf");
}

export const Field = ({ l, en, children, className = "" }) => (
  <div className={`border-b border-dotted border-slate-400 pb-1 ${className}`}>
    <p className="text-[10px] text-slate-500">{l}{en && <span className="ml-1 normal-case text-slate-400">· {en}</span>}</p>
    <p className="min-h-[1.4em] font-semibold text-slate-900">{children || "—"}</p>
  </div>
);

export default function A4Doc({ title, titleEn, filename, children, code, footerNote, school: schoolProp, back }) {
  const { x } = useLang();
  const fetched = useSchool(); const school = schoolProp || fetched;
  const sheet = useRef(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [zoom, setZoom] = useState(1);
  useEffect(() => { const f = () => setZoom(Math.min(1, (window.innerWidth - 24) / 794)); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  async function pdf() { setBusy(true); setErr(""); try { await downloadPdf(sheet.current, filename || "document"); } catch (e) { console.error(e); setErr(x("PDF তৈরি করা যায়নি — \"প্রিন্ট\" চেপে \"Save as PDF\" বেছে নিন")); } setBusy(false); }
  return (
    <div className="a4-wrap mx-auto max-w-[840px]">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        {back}
        <button className="btn-primary !py-2" onClick={pdf} disabled={busy || !school}><Icon name="file" className="h-4 w-4" /> {busy ? x("তৈরি হচ্ছে...") : x("PDF ডাউনলোড")}</button>
        <button className="btn-ghost !py-2" onClick={() => window.print()}><Icon name="print" className="h-4 w-4" /> {x("প্রিন্ট করুন")}</button>
        {err && <p role="alert" className="w-full rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
      </div>
      <div className="a4-scroll overflow-x-auto pb-4">
        <div ref={sheet} className="a4-sheet mx-auto bg-white text-slate-900 shadow-lux" style={{ width: "210mm", minHeight: "297mm", padding: "13mm 14mm", zoom, boxSizing: "border-box", position: "relative", fontSize: "13px", lineHeight: 1.55 }}>
          <div style={{ position: "absolute", inset: "6mm", border: "1.2px solid #C49B3F", borderRadius: 4, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: "7.4mm", border: "0.5px solid #E8D08A", pointerEvents: "none" }} />
          <header className="relative text-center">
            <div className="flex items-center justify-center gap-4">
              {school?.logo ? <img src={school.logo} alt="" style={{ height: 62, width: 62, objectFit: "cover", borderRadius: 9999 }} /> : <Crest className="h-14 w-auto text-gold-deep" />}
              <div className="text-left">
                <h1 style={{ fontFamily: "var(--font-display), var(--font-bn), serif", fontSize: 25, lineHeight: 1.2, color: "#0A4435", margin: 0 }}>{school?.name || ""}</h1>
                {school?.nameEn && <p style={{ fontSize: 14, fontWeight: 600, color: "#9A7623" }}>{school.nameEn}</p>}
                {(school?.tagline || school?.taglineEn) && <p style={{ fontSize: 11, color: "#64748b" }}>{[school.tagline, school.taglineEn].filter(Boolean).join(" · ")}</p>}
              </div>
            </div>
            {(school?.address || school?.phone) && <p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{[school.address, school.phone, school.email].filter(Boolean).join("  |  ")}</p>}
            <div style={{ height: 3, margin: "10px 0 0", background: "linear-gradient(90deg, transparent, #C49B3F, transparent)" }} />
            <div style={{ height: 1, margin: "2px 0 14px", background: "linear-gradient(90deg, transparent, #0A4435, transparent)" }} />
            <h2 style={{ display: "inline-block", fontFamily: "var(--font-display), var(--font-bn), serif", fontSize: 19, lineHeight: 1.6, color: "#fff", background: "#0A4435", padding: "2px 26px", borderRadius: 3, margin: 0 }}>{title}{titleEn && <span style={{ fontSize: 12, opacity: .8 }}> · {titleEn}</span>}</h2>
          </header>
          <main style={{ marginTop: 16, position: "relative" }}>{children}</main>
          <footer style={{ position: "absolute", left: "14mm", right: "14mm", bottom: "10mm", display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 4 }}>
            <span>{footerNote || x("কম্পিউটারে তৈরি নথি")}</span><span>{code}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
