// দ্বিভাষিক সিস্টেম: বাংলা বাক্যই "কী" (key)। বাংলা মোডে কী-ই দেখায়; English মোডে lib/i18n-en.js থেকে অনুবাদ নেয়।
// অনুবাদ না পেলে মূল বাংলাই দেখায় (কখনো ফাঁকা বা ভাঙা নয়)। {0},{1} = ডাইনামিক মান।
import { en, enPatterns } from "@/lib/i18n-en";
import { setNumLang, getNumLang, bn as fmtNumber } from "@/lib/school";

export const LANGS = ["bn", "en"];
export { setNumLang, getNumLang };

export function translate(lang, key, params) {
  if (typeof key !== "string") return key;
  let s = key;
  if (lang === "en") {
    s = en[key];
    if (s === undefined) { // শুরু/শেষের ফাঁকা অংশ বাদ দিয়ে খুঁজে আবার জুড়ে দিই (যেমন " — {0} দিন")
      const m = key.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (m[2] && m[2] !== key && en[m[2]] !== undefined) return translate(lang, m[2], params) .replace(/^/, m[1]) + m[3];
      s = key;
      for (const [re, fn] of enPatterns) { const m = key.match(re); if (m) { s = fn(m, (k) => en[k] ?? k); break; } }
    }
  }
  return params ? s.replace(/\{(\d+)\}/g, (_, i) => String(params[i] ?? "")) : s;
}

// সংখ্যা: বাংলায় বাংলা অঙ্ক, English এ ইংরেজি অঙ্ক
export const fmtNum = (n, lang) => fmtNumber(n, lang ?? getNumLang());

// ব্যক্তি/প্রতিষ্ঠানের নাম: বর্তমান ভাষার নাম আগে, না থাকলে অন্য ভাষারটা
export function pickName(bnName, enName, lang) {
  lang = lang ?? getNumLang();
  const a = lang === "en" ? enName : bnName, b = lang === "en" ? bnName : enName;
  return (a && String(a).trim()) || (b && String(b).trim()) || "";
}
