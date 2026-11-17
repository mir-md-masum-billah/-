"use client";
import { useEffect, useState } from "react";
import Crest from "./Crest";
import Icon from "./Icon";
import useSchool from "@/hooks/useSchool";
import { useLang } from "./LangProvider";

// A4 নথির কাঠামো: লোগো (পুরো ছবি, গোল করে কাটা নয়), স্কুলের নাম, ঠিকানা। ডাউনলোড = প্রিন্ট ("Save as PDF" বেছে নিলেই PDF) — এক সিস্টেম, লেখা সিলেক্টযোগ্য।
export const Field = ({ l, en, children, className = "" }) => (
  <div className={`border-b border-dotted border-slate-400 pb-1 ${className}`}>
    <p className="text-[10px] text-slate-500">{l}{en && <span className="ml-1 normal-case text-slate-400">· {en}</span>}</p>
    <p className="min-h-[1.4em] font-semibold text-slate-900">{children || "—"}</p>
  </div>
);

export default function A4Doc({ title, titleEn, filename, children, code, footerNote, school: schoolProp, back }) {
  const { x } = useLang();
  const fetched = useSchool(); const school = schoolProp || fetched;
  const [zoom, setZoom] = useState(1);
  useEffect(() => { const f = () => setZoom(Math.min(1, (window.innerWidth - 24) / 794)); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  useEffect(() => { if (!school || typeof location === "undefined" || !/[?&]print=1/.test(location.search)) return; const t = setTimeout(() => window.print(), 700); return () => clearTimeout(t); }, [school]);
  return (
    <div className="a4-wrap mx-auto max-w-[840px]">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        {back}
        <button className="btn-primary !py-2" onClick={() => window.print()} disabled={!school}><Icon name="print" className="h-4 w-4" /> {x("প্রিন্ট / PDF সংরক্ষণ")}</button>
      </div>
      <div className="a4-scroll overflow-x-auto pb-4">
        <div className="a4-sheet mx-auto bg-white text-slate-900 shadow-lux" style={{ width: "210mm", minHeight: "297mm", padding: "13mm 14mm", zoom, boxSizing: "border-box", position: "relative", fontSize: "13px", lineHeight: 1.55 }}>
          <div style={{ position: "absolute", inset: "6mm", border: "1.2px solid #C49B3F", borderRadius: 4, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: "7.4mm", border: "0.5px solid #E8D08A", pointerEvents: "none" }} />
          <header className="relative text-center">
            <div className="flex items-center justify-center gap-4">
              {school?.logo ? <img src={school.logo} alt="" style={{ height: 64, width: "auto", maxWidth: 110, objectFit: "contain", borderRadius: 0 }} /> : <Crest className="h-14 w-auto text-gold-deep" />}
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
