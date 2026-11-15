"use client";
import { useEffect, useState } from "react";
import { useLang } from "./LangProvider";

// স্বাগত লোডিং স্ক্রিন — তোরণটি সোনালি রেখায় আঁকা হয়, তারপর তারা ফোটে ও নাম ওঠে।
// প্রতিটি ব্রাউজার-সেশনে একবার দেখায় (layout.js-এর ছোট স্ক্রিপ্ট `no-splash` ক্লাস বসিয়ে বাকি বার লুকায়)।
// CSS নিজেই ~৩ সেকেন্ড পরে মিলিয়ে দেয়; JS শুধু DOM থেকে সরায়। ট্যাপ/ক্লিকে সাথে সাথে বন্ধ।
export default function Splash({ name, tagline, logo }) {
  const { t } = useLang();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains("no-splash")) { setGone(true); return; }
    try { sessionStorage.setItem("splash", "1"); } catch {}
    const id = setTimeout(() => setGone(true), 3900);
    return () => clearTimeout(id);
  }, []);

  if (gone) return null;
  return (
    <div id="splash" role="status" aria-live="polite" onClick={() => setGone(true)}>
      <div className="sp-inner">
        {logo ? (
          <img src={logo} alt="" className="sp-logo" />
        ) : (
          <svg viewBox="0 0 48 62" className="sp-crest" fill="none" aria-hidden="true">
            <path className="sp-draw" style={{ animationDelay: ".15s" }} pathLength="1" d="M4 58V26C4 13.3 12.9 4 24 4s20 9.3 20 22v32" stroke="currentColor" strokeWidth="1.7" />
            <path className="sp-draw" style={{ animationDelay: ".6s" }} pathLength="1" d="M10 58V26c0-9.9 6-18 14-18s14 8.1 14 18v32" stroke="currentColor" strokeOpacity=".55" strokeWidth="1" />
            <path className="sp-draw" style={{ animationDelay: "1s" }} pathLength="1" d="M1 58h46" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <g transform="translate(24 32)">
              <g className="sp-star" stroke="currentColor" strokeWidth="1.4">
                <rect x="-7" y="-7" width="14" height="14" />
                <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
              </g>
            </g>
          </svg>
        )}
        <h2 className="sp-rise sp-name" style={{ animationDelay: "1.35s" }}>{name}</h2>
        <span className="sp-rule" />
        <p className="sp-rise sp-tag" style={{ animationDelay: "1.7s" }}>{tagline}</p>
        <div className="sp-bar" aria-hidden="true"><span /></div>
        <p className="sp-load">{t.splash.loading}</p>
      </div>
    </div>
  );
}
