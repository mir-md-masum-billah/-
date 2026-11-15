import Link from "next/link";
import Crest from "./Crest";
import LanguageSwitch from "./LanguageSwitch";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icon";
import { getLang } from "@/lib/lang";
import { tr } from "@/lib/translations";
import { getDashboardHref } from "@/lib/session";

export function Mark({ logo, className = "h-9" }) {
  return logo
    ? <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-gold-soft/60" />
    : <Crest className={`${className} w-auto text-gold-soft`} />;
}

// পাবলিক পেজগুলোর সাধারণ হেডার (সার্ভার কম্পোনেন্ট) — ভাষা বদলের বাটনসহ
export default async function SiteHeader({ name, logo, current }) {
  const t = tr(await getLang());
  const dash = await getDashboardHref();
  const links = [
    { href: "/#about", label: t.nav.about, key: "about" },
    { href: "/notices", label: t.nav.notices, key: "notices" },
    { href: "/admission", label: t.nav.admission, key: "admission" },
    { href: "#contact", label: t.nav.contact, key: "contact" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-gold/25 bg-night/90 text-white backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5" aria-label={t.nav.menu}>
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Mark logo={logo} />
          <span className="truncate font-display text-lg sm:text-xl">{name}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link key={l.key} href={l.href} aria-current={current === l.key ? "page" : undefined}
              className={`hidden rounded px-3 py-1.5 text-[15px] transition md:block ${current === l.key ? "text-gold-soft" : "text-white/80 hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
          <LanguageSwitch className="sm:mr-1" />
          <ThemeToggle className="!hidden sm:!grid" />
          <Link href={dash || "/login"} className="btn-gold !px-4 !py-2 sm:!px-5">{dash ? t.nav.dashboard : t.nav.login}</Link>
          <details className="group relative md:hidden">
            <summary aria-label={t.nav.menu} className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-gold-soft/40 text-gold-soft [&::-webkit-details-marker]:hidden"><Icon name="menu" className="h-5 w-5" /></summary>
            <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-gold/30 bg-night p-2 shadow-gilt">
              {links.map((l) => <Link key={l.key} href={l.href} className="block rounded-md px-3 py-2.5 text-white/85 hover:bg-white/[0.07] hover:text-gold-soft">{l.label}</Link>)}
              <div className="mt-1 flex items-center justify-between border-t border-gold/20 px-3 pt-2.5"><span className="text-sm text-white/60">{t.themeLabel}</span><ThemeToggle /></div>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
