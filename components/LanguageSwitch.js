"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLang } from "./LangProvider";
import Icon from "./Icon";

// ভাষা বদলের বাটন — শুধু আইকন। চাপলে বাংলা ⇄ English; কুকিতে `lang` রেখে পেজ রিফ্রেশ করে (রিলোড লাগে না)
export default function LanguageSwitch({ tone = "dark", className = "" }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const dark = tone === "dark";
  const next = lang === "en" ? "bn" : "en";
  const nextName = next === "en" ? "English" : "বাংলা";

  function toggle() {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <button type="button" onClick={toggle} lang={next} title={nextName} aria-label={`${t.switchLabel}: ${nextName}`} disabled={pending}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${pending ? "opacity-60" : ""} ${dark ? "border-gold-soft/40 bg-white/5 text-white/80 hover:border-gold-soft hover:text-white" : "border-brand/20 bg-white text-brand/80 hover:border-brand hover:text-brand-dark"} ${className}`}>
      <Icon name="globe" className="h-[18px] w-[18px]" />
    </button>
  );
}
