"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useLang } from "./LangProvider";

// লাইট ⇄ ডার্ক মোড; পছন্দ localStorage-এ থাকে (পেইন্টের আগে layout.js-এর স্ক্রিপ্ট বসায়)
export default function ThemeToggle({ tone = "dark", className = "" }) {
  const { t } = useLang();
  const [dark, setDark] = useState(null);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  }
  const label = dark ? t.theme.light : t.theme.dark;
  return (
    <button type="button" onClick={toggle} title={label} aria-label={label} aria-pressed={!!dark}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${tone === "dark" ? "border-gold-soft/40 bg-white/5 text-gold-soft hover:bg-white/10" : "border-brand/20 bg-white text-brand hover:border-gold"} ${className}`}>
      <Icon name={dark ? "sun" : "moon"} className="h-[18px] w-[18px]" />
    </button>
  );
}
