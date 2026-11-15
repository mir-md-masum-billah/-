"use client";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/ui/Logo";
import { LangSwitch, ThemeToggle, useT } from "@/components/Providers";

// লগইন/ভর্তি/নোটিশ পেজের উপরের বার: ফিরে যাওয়া + ভাষা + থিম
export default function PublicBar({ onDark = false }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold ${onDark ? "text-white/90 hover:text-white" : "text-brand hover:underline"}`}>
        <Icon name="left" size={18} />{t("হোমপেজ")}
      </Link>
      <div className="flex items-center gap-2"><LangSwitch onDark={onDark} /><ThemeToggle onDark={onDark} /></div>
    </div>
  );
}

// ভেতরের পাবলিক পেজের (নোটিশ, ভর্তি) গাঢ় সবুজ শিরোনাম-ব্যান্ড — নিচে খিলানশ্রেণি
export function PublicHero({ title, subtitle, children }) {
  return (
    <>
    <header className="jamdani relative overflow-hidden bg-deep text-white">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-5 sm:pb-10">
        <PublicBar onDark />
        <div className="mt-8 flex items-center gap-4">
          <Logo size={52} tone="light" />
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-normal leading-tight sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-1 truncate text-white/70">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </header>
    <div className="arcade" aria-hidden="true" />
    </>
  );
}
