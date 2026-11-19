"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import PasswordDialog from "./PasswordDialog";
import Crest from "./Crest";
import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";
import ThemeToggle from "./ThemeToggle";
import { useLang } from "./LangProvider";
import { roleLabel } from "@/lib/rbac";
import PageTablePrint from "./PageTablePrint";

const nav = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: "home" },
  { href: "/admin/students", label: "শিক্ষার্থী", icon: "cap", perm: "students.read" },
  { href: "/admin/applications", label: "ভর্তির আবেদন", icon: "inbox", perm: "applications.manage" },
  { href: "/admin/promotion", label: "প্রমোশন ও রোল", icon: "promote", perm: ["students.promote", "promote.own"] },
  { href: "/admin/academics", label: "শ্রেণি-বিষয়-নিয়োগ", icon: "school", perm: "students.read" },
  { href: "/admin/class-dashboard", label: "ক্লাস ড্যাশবোর্ড", icon: "bars", perm: "students.read" },
  { href: "/admin/attendance", label: "হাজিরা", icon: "check", perm: "attendance.read" },
  { href: "/admin/attendance/report", label: "হাজিরা রিপোর্ট", icon: "trend", perm: "attendance.read" },
  { href: "/admin/staff-attendance", label: "স্টাফ হাজিরা", icon: "clock", perm: "staffattendance.read" },
  { href: "/admin/leave", label: "ছুটি", icon: "calendar" },
  { href: "/admin/routine", label: "ক্লাস রুটিন", icon: "clock", perm: "routine.manage" },
  { href: "/admin/my-routine", label: "আমার রুটিন", icon: "calendar", role: "teacher" },
  { href: "/admin/me", label: "আমার প্রোফাইল", icon: "users" },
  { href: "/admin/exams", label: "পরীক্ষার নোটিশ", icon: "clipboard", perm: "exams.manage" },
  { href: "/admin/results", label: "পরীক্ষার ফলাফল", icon: "file", perm: "results.read" },
  { href: "/admin/fees", label: "বেতন ও ফি", icon: "wallet", perm: "fees.read" },
  { href: "/admin/pay-requests", label: "অনলাইন পেমেন্ট যাচাই", icon: "inbox", perm: "payments.review" },
  { href: "/admin/accounts", label: "হিসাব নিকাশ", icon: "bars", perm: "accounts.read" },
  { href: "/admin/notices", label: "নোটিশ", icon: "megaphone", perm: "notices.write" },
  { href: "/admin/staff", label: "শিক্ষক ও স্টাফ", icon: "users", perm: "staff.read" },
  { href: "/admin/settings", label: "সেটিংস", icon: "sliders", perm: "settings.manage" },
  { href: "/admin/audit", label: "অডিট লগ", icon: "shield", perm: "audit.read" },
];

export default function AdminShell({ session, schoolName, children }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const [pending, setPending] = useState({});
  // অপেক্ষমাণ অনুরোধের সংখ্যা: পেজ বদলালে ও প্রতি ৬০ সেকেন্ডে নতুন করে আনে
  useEffect(() => {
    let dead = false; const load = () => fetch("/api/pending").then((r) => (r.ok ? r.json() : {})).then((j) => { if (!dead) setPending(j || {}); }).catch(() => {});
    load(); const t = setInterval(load, 60000); return () => { dead = true; clearInterval(t); };
  }, [path]);
  const items = nav.filter((n) => (!n.perm || [].concat(n.perm).some((p) => session.perms.includes(p))) && (!n.role || (n.role === "teacher" ? ["teacher", "headmaster", "admin", "superadmin"].includes(session.role) : session.role === n.role)));
  return (
    <div className="min-h-screen lg:flex print:block">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gold/25 bg-night px-4 py-3 text-white lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} aria-label={t.shell.openMenu} className="rounded p-1 text-gold-soft"><Icon name="menu" className="h-6 w-6" /></button>
        <span className="flex min-w-0 items-center gap-2 font-display text-lg"><Crest className="h-6 w-auto shrink-0 text-gold-soft" /><span className="hidden truncate min-[480px]:inline">{schoolName}</span></span>
        <span className="flex items-center gap-1.5"><LanguageSwitch /><ThemeToggle /></span>
      </header>
      {open && <div className="fixed inset-0 z-40 bg-night/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-night text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-start gap-3 border-b border-gold/20 px-5 py-6">
          <Crest className="h-12 w-auto shrink-0 text-gold-soft" />
          <div className="min-w-0">
            <p className="font-display text-xl leading-snug">{schoolName}</p>
            <p className="mt-1 text-sm text-gold-soft/90">{session.name} · {t.shell.roles[session.role] || roleLabel[session.role]}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label={t.nav.menu}>
          {items.map((n) => {
            const on = path === n.href;
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition ${on ? "bg-white/[0.08] text-gold-soft" : "text-white/75 hover:bg-white/[0.05] hover:text-white"}`}>
                {on && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold" />}
                <Icon name={n.icon} className="h-[18px] w-[18px] shrink-0" />{t.shell.nav[n.href] || n.label}
                {pending[n.href] > 0 && <span aria-label={`${pending[n.href]} pending`} className="ml-auto grid min-w-[22px] place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold leading-none text-white shadow">{pending[n.href] > 99 ? "99+" : pending[n.href]}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-gold/20 p-3">
          <div className="flex items-center justify-between gap-2 px-1 pb-2"><LanguageSwitch /><ThemeToggle /></div>
          <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"><Icon name="globe" className="h-[18px] w-[18px]" />{t.shell.viewSite}</Link>
          <PasswordDialog className="btn w-full justify-start !px-3 !py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white" />
          <LogoutButton className="btn w-full justify-start !px-3 !py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white" />
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8 print:p-0"><div className="mx-auto max-w-7xl print:max-w-none">{children}<PageTablePrint /></div></main>
    </div>
  );
}
