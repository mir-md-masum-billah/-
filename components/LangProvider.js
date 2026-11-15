"use client";
import { createContext, useContext, useMemo } from "react";
import { tr, num, dateL, moneyL } from "@/lib/translations";
import { adminEn } from "@/lib/admin-en";

const Ctx = createContext("bn");
export function LangProvider({ lang, children }) { return <Ctx.Provider value={lang}>{children}</Ctx.Provider>; }

// ক্লায়েন্ট কম্পোনেন্টে: const { lang, t, x, n, money, date } = useLang();
//  x("বাংলা লেখা")            → ইংরেজিতে হলে adminEn থেকে অনুবাদ, না পেলে মূল লেখাই
//  x("মোট {0} টি", count)     → {0}, {1} ... জায়গায় মান বসে (সংখ্যাও ভাষা অনুযায়ী)
//  n(12000) / money(12000) / date("2026-01-05")
export function useLang() {
  const lang = useContext(Ctx);
  return useMemo(() => {
    const en = lang === "en";
    const fill = (s, args) => s.replace(/\{(\d+)\}/g, (_, i) => (args[i] === undefined || args[i] === null ? "" : String(args[i])));
    const x = (s, ...args) => {
      if (typeof s !== "string") return s;
      const base = en ? (adminEn[s] ?? s) : s;
      return args.length ? fill(base, args.map((a) => (typeof a === "number" ? num(a, lang) : a))) : base;
    };
    return { lang, t: tr(lang), x, n: (v) => num(v, lang), money: (v) => moneyL(v, lang), date: (v) => dateL(v, lang) };
  }, [lang]);
}
