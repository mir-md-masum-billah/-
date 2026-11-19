"use client";
import { useEffect, useRef, useState } from "react";
import Crest from "./Crest";
import Icon from "./Icon";
import useSchool from "@/hooks/useSchool";
import { useLang } from "./LangProvider";
import { docName } from "@/lib/docname";

// A4 নথির কাঠামো: লোগো (পুরো ছবি — কোনো কোনা কাটে না), স্কুলের নাম, ঠিকানা। ডাউনলোড = প্রিন্ট ("Save as PDF" বেছে নিলেই PDF) — এক সিস্টেম, লেখা সিলেক্টযোগ্য।
// ভাষা: বাংলা বেছে থাকলে বাংলা নাম/স্লোগান, English বেছে থাকলে ইংরেজি নাম/স্লোগান ছাপা হয়।
export const Field = ({ l, en, children, className = "" }) => (
  <div className={`border-b border-dotted border-slate-400 pb-1 ${className}`}>
    <p className="text-[10px] text-slate-500">{l}{en && <span className="ml-1 normal-case text-slate-400">· {en}</span>}</p>
    <p className="min-h-[1.4em] font-semibold text-slate-900">{children || "—"}</p>
  </div>
);

// ছবি (লোগো, শিক্ষার্থীর ছবি) পুরো লোড হওয়ার পরেই প্রিন্ট — নইলে লোগো অর্ধেক/কাটা ছাপা হতো
async function imagesReady(ms = 6000) {
  const imgs = [...document.images];
  const wait = Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))));
  await Promise.race([wait, new Promise((r) => setTimeout(r, ms))]);
  try { await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]); } catch { /* ignore */ }
  await Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : 0)));
}
export async function printNow() { await imagesReady(); await new Promise((r) => setTimeout(r, 250)); window.print(); }

// পেজের title = PDF ফাইলের নাম। আইফ্রেমে প্রিন্ট হলে বাইরের পেজের title-ও বদলায়, প্রিন্ট শেষে আগের অবস্থায় ফিরে আসে
export function useDocTitle(title) {
  useEffect(() => {
    if (!title) return;
    const docs = [document]; try { if (window.parent !== window && window.parent.document) docs.push(window.parent.document); } catch { /* ভিন্ন origin */ }
    const old = docs.map((d) => d.title); docs.forEach((d) => { d.title = title; });
    const back = () => docs.forEach((d, i) => { d.title = old[i]; });
    window.addEventListener("afterprint", back);
    return () => { window.removeEventListener("afterprint", back); back(); };
  }, [title]);
}

export function schoolNameFor(school, lang) { return (lang === "en" ? school?.nameEn || school?.name : school?.name || school?.nameEn) || ""; }

const LATTICE = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><g fill="none" stroke="#C49B3F" stroke-width=".6"><path d="M22 0 44 22 22 44 0 22Z" stroke-opacity=".28"/><circle cx="22" cy="22" r="7" stroke-opacity=".22"/><path d="M0 0 44 44M44 0 0 44" stroke-opacity=".08"/></g></svg>')}")`;
const Corner = ({ style }) => <svg width="46" height="46" viewBox="0 0 46 46" fill="none" style={{ position: "absolute", ...style }}><path d="M3 43V10C3 6 6 3 10 3h33" stroke="#C49B3F" strokeWidth="1.6" /><path d="M9 43V14c0-3 2-5 5-5h29" stroke="#C49B3F" strokeWidth=".7" strokeOpacity=".7" /><circle cx="3" cy="3" r="2.4" fill="#C49B3F" /></svg>;

// multi = একাধিক নথি একসাথে (DocBundle ভেতরে): নিজের টুলবার/অটো-প্রিন্ট থাকে না
// onePage = ঠিক এক পাতায় আঁটে (বেশি হলে নিজে ছোট হয়ে যায়); luxury = সোনালি নকশা, জমিনে নকশা ও লোগোর জলছাপ
export default function A4Doc({ title, titleEn, docTitle, filename, children, code, footerNote, school: schoolProp, back, multi = false, onePage = false, luxury = false }) {
  const { x, lang } = useLang();
  const fetched = useSchool(); const school = schoolProp || fetched;
  const [zoom, setZoom] = useState(1);
  const box = useRef(null), inner = useRef(null);
  const L = (bn, en) => (lang === "en" ? en : bn);
  const sName = schoolNameFor(school, lang);
  useDocTitle(!multi && school ? docName([sName, docTitle || title || filename]) : "");
  useEffect(() => { const f = () => setZoom(Math.min(1, (window.innerWidth - 24) / 794)); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  useEffect(() => { if (multi || !school || typeof location === "undefined" || !/[?&]print=1/.test(location.search)) return; let dead = false; (async () => { await new Promise((r) => setTimeout(r, 400)); if (!dead) await printNow(); })(); return () => { dead = true; }; }, [school, multi]);
  // এক পাতায় আঁটানো: ভেতরের লেখা বেশি লম্বা হলে অনুপাতে ছোট করা (প্রিন্টের ঠিক আগেও আবার মাপে)
  useEffect(() => {
    if (!onePage) return;
    const fit = () => { const b = box.current, i = inner.current; if (!b || !i) return; i.style.zoom = 1; const r = b.clientHeight / Math.max(1, i.scrollHeight); i.style.zoom = r < 1 ? Math.max(0.55, r - 0.004) : 1; };
    fit(); const ts = [setTimeout(fit, 300), setTimeout(fit, 1200)];
    window.addEventListener("beforeprint", fit); document.fonts?.ready?.then(fit).catch(() => {});
    const imgs = [...(box.current?.querySelectorAll("img") || [])]; imgs.forEach((i) => i.addEventListener("load", fit));
    return () => { ts.forEach(clearTimeout); window.removeEventListener("beforeprint", fit); imgs.forEach((i) => i.removeEventListener("load", fit)); };
  });
  const logo = school?.logo ? (
    <div style={{ height: 76, maxWidth: 130, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "visible" }}>
      <img src={school.logo} alt="" style={{ display: "block", maxHeight: 76, maxWidth: 130, width: "auto", height: "auto", objectFit: "contain", borderRadius: 0, clipPath: "none" }} />
    </div>
  ) : <Crest className="h-14 w-auto text-gold-deep" />;
  const tagline = lang === "en" ? school?.taglineEn || school?.tagline : school?.tagline || school?.taglineEn;
  const header = (
    <header className="relative text-center">
      <div className="flex items-center justify-center gap-4">
        {logo}
        <div className="text-left">
          <h1 style={{ fontFamily: "var(--font-display), var(--font-bn), serif", fontSize: 25, lineHeight: 1.2, color: "#0A4435", margin: 0 }}>{sName}</h1>
          {tagline && <p style={{ fontSize: 11.5, color: "#9A7623", fontWeight: 600, margin: 0 }}>{tagline}</p>}
        </div>
      </div>
      {(school?.address || school?.phone) && <p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{[school.address, school.phone, school.email].filter(Boolean).join("  |  ")}</p>}
      <div style={{ height: 3, margin: "10px 0 0", background: "linear-gradient(90deg, transparent, #C49B3F, transparent)" }} />
      <div style={{ height: 1, margin: "2px 0 12px", background: "linear-gradient(90deg, transparent, #0A4435, transparent)" }} />
      <h2 style={{ display: "inline-block", fontFamily: "var(--font-display), var(--font-bn), serif", fontSize: 19, lineHeight: 1.6, color: "#fff", background: "#0A4435", padding: "2px 26px", borderRadius: 3, margin: 0 }}>{title}{titleEn && <span style={{ fontSize: 12, opacity: .8 }}> · {titleEn}</span>}</h2>
    </header>
  );
  const footer = (
    <footer style={{ position: "absolute", left: "14mm", right: "14mm", bottom: "10mm", display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 4 }}>
      <span>{footerNote || L("কম্পিউটারে তৈরি নথি", "Computer-generated document")}</span><span>{code}</span>
    </footer>
  );
  return (
    <div className="a4-wrap mx-auto max-w-[840px]">
      {!multi && <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        {back}
        <button className="btn-primary !py-2" onClick={printNow} disabled={!school}><Icon name="print" className="h-4 w-4" /> {L("প্রিন্ট / PDF সংরক্ষণ", "Print / Save as PDF")}</button>
      </div>}
      <div className="a4-scroll overflow-x-auto pb-4">
        <div className="a4-sheet mx-auto bg-white text-slate-900 shadow-lux" style={{ width: "210mm", minHeight: "297mm", ...(onePage ? { height: "296mm", overflow: "hidden" } : {}), padding: "13mm 14mm", zoom, boxSizing: "border-box", position: "relative", fontSize: "13px", lineHeight: 1.55, ...(luxury ? { background: "radial-gradient(circle at 50% 0%, #FFFEF8 0%, #FBF7E8 55%, #F5EDD3 100%)" } : {}) }}>
          {luxury && <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: LATTICE, opacity: 0.55, pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: "50%", top: "52%", width: "125mm", height: "125mm", transform: "translate(-50%,-50%)", opacity: 0.075, pointerEvents: "none", display: "grid", placeItems: "center" }}>
              {school?.logo ? <img src={school.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <Crest className="h-full w-full text-gold-deep" />}
            </div>
            <div style={{ position: "absolute", inset: "4.4mm", border: "2.4px solid #0A4435", borderRadius: 6, pointerEvents: "none" }} />
            <Corner style={{ left: "8mm", top: "8mm" }} /><Corner style={{ right: "8mm", top: "8mm", transform: "scaleX(-1)" }} /><Corner style={{ left: "8mm", bottom: "8mm", transform: "scaleY(-1)" }} /><Corner style={{ right: "8mm", bottom: "8mm", transform: "scale(-1,-1)" }} />
          </>}
          <div style={{ position: "absolute", inset: "6mm", border: "1.2px solid #C49B3F", borderRadius: 4, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: "7.4mm", border: "0.5px solid #E8D08A", pointerEvents: "none" }} />
          {onePage ? (
            <div ref={box} style={{ height: "calc(296mm - 26mm - 9mm)", overflow: "hidden", position: "relative" }}>
              <div ref={inner}>{header}<main style={{ marginTop: 12, position: "relative" }}>{children}</main></div>
            </div>
          ) : <>{header}<main style={{ marginTop: 16, position: "relative" }}>{children}</main></>}
          {footer}
        </div>
      </div>
    </div>
  );
}

// একাধিক A4 নথি একসাথে (প্রোফাইল + পেমেন্ট + ফলাফল ইত্যাদি) — এক টুলবার, এক প্রিন্ট, প্রতিটি নথি আলাদা পাতায়
export function DocBundle({ docTitle, back, children }) {
  const { lang } = useLang(); const school = useSchool();
  useDocTitle(school ? docName([schoolNameFor(school, lang), docTitle]) : "");
  useEffect(() => { if (!school || typeof location === "undefined" || !/[?&]print=1/.test(location.search)) return; let dead = false; (async () => { await new Promise((r) => setTimeout(r, 500)); if (!dead) await printNow(); })(); return () => { dead = true; }; }, [school]);
  return (
    <div>
      <div className="no-print mx-auto mb-4 flex max-w-[840px] flex-wrap items-center gap-2">
        {back}
        <button className="btn-primary !py-2" onClick={printNow} disabled={!school}><Icon name="print" className="h-4 w-4" /> {lang === "en" ? "Print / Save as PDF" : "প্রিন্ট / PDF সংরক্ষণ"}</button>
      </div>
      {children}
    </div>
  );
}
