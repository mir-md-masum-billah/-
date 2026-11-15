"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { translate, setNumLang, fmtNum } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

const Ctx = createContext(null);
const YEAR = 60 * 60 * 24 * 365;
const setCookie = (k, v) => { document.cookie = `${k}=${v};path=/;max-age=${YEAR};samesite=lax`; try { localStorage.setItem(k, v); } catch {} };

export function Providers({ initialLang = "bn", initialTheme = "light", children }) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);
  const [theme, setThemeState] = useState(initialTheme);
  setNumLang(lang); // children এর আগেই সেট হয়, তাই bn()/money() সঠিক ভাষায় চলে

  useEffect(() => { // থিম: কুকি/সিস্টেম পছন্দ থেকে আসল মান (প্রথম পেইন্টের আগে ইনলাইন স্ক্রিপ্ট ক্লাস বসিয়েছে)
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l) => {
    if (l !== "bn" && l !== "en") return;
    setCookie("lang", l); document.documentElement.lang = l; setLangState(l);
    router.refresh(); // সার্ভার কম্পোনেন্টও নতুন ভাষায় আসবে
  }, [router]);
  const setTheme = useCallback((th) => {
    if (th !== "light" && th !== "dark") return;
    setCookie("theme", th);
    document.documentElement.classList.toggle("dark", th === "dark");
    document.documentElement.style.colorScheme = th;
    setThemeState(th);
  }, []);

  const value = useMemo(() => ({
    lang, theme, setLang, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    t: (k, p) => translate(lang, k, p), n: (x) => fmtNum(x, lang),
  }), [lang, theme, setLang, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const fallback = { lang: "bn", theme: "light", setLang() {}, setTheme() {}, toggleTheme() {}, t: (k, p) => translate("bn", k, p), n: (x) => fmtNum(x, "bn") };
export const useI18n = () => useContext(Ctx) || fallback;
export const useT = () => useI18n().t;
export const useLang = () => useI18n().lang;

export function ThemeToggle({ className = "", onDark = false }) {
  const { theme, toggleTheme, t } = useI18n();
  const dark = theme === "dark";
  return (
    <button type="button" onClick={toggleTheme} aria-pressed={dark} title={dark ? t("লাইট মোড") : t("ডার্ক মোড")} aria-label={dark ? t("লাইট মোডে যান") : t("ডার্ক মোডে যান")} className={`icon-btn ${onDark ? "!border-white/25 !bg-white/10 !text-white hover:!bg-white/20" : ""} ${className}`}>
      <Icon name={dark ? "sun" : "moon"} size={19} />
    </button>
  );
}

export function LangSwitch({ className = "", onDark = false }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t("ভাষা")} className={`inline-flex h-10 items-center rounded-full border p-0.5 text-sm font-semibold ${onDark ? "border-white/25 bg-white/10" : "border-line bg-surface"} ${className}`}>
      {[["bn", "বাংলা"], ["en", "EN"]].map(([k, label]) => (
        <button key={k} type="button" onClick={() => setLang(k)} aria-pressed={lang === k} className={`h-9 rounded-full px-3 transition ${lang === k ? (onDark ? "bg-gold text-[#12201B]" : "bg-brand-solid text-white shadow-soft") : (onDark ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-brand")}`}>{label}</button>
      ))}
    </div>
  );
}
