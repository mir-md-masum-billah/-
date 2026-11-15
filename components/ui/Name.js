"use client";
import { useLang } from "@/components/Providers";
import { pickName } from "@/lib/i18n";

// দুই ভাষার নাম পাশাপাশি: বর্তমান ভাষার নাম বড়, অন্য ভাষার নাম ছোট ও ঝাপসা। একটি না থাকলে অন্যটিই দেখায়
export default function Name({ bn, en, className = "", stacked = true }) {
  const lang = useLang();
  const main = pickName(bn, en, lang);
  const other = lang === "en" ? bn : en;
  const showOther = other && String(other).trim() && String(other).trim() !== main;
  if (!main) return <span className="text-slate-400">—</span>;
  return stacked
    ? <span className={`inline-flex flex-col leading-tight ${className}`}><span className="font-medium">{main}</span>{showOther && <span className="text-xs text-slate-500">{other}</span>}</span>
    : <span className={className}>{main}{showOther && <span className="ml-1 text-slate-500">({other})</span>}</span>;
}
// নাম-স্ট্রিং (যেমন ড্রপডাউন লেবেল) এর জন্য
export function nameText(bn, en, lang) { return pickName(bn, en, lang); }
