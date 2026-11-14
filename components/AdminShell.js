"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { roleLabel } from "@/lib/rbac";

const nav = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: "🏠" },
  { href: "/admin/students", label: "শিক্ষার্থী", icon: "🎓", perm: "students.read" },
  { href: "/admin/applications", label: "ভর্তির আবেদন", icon: "📥", perm: "applications.manage" },
  { href: "/admin/promotion", label: "প্রমোশন ও রোল", icon: "⬆️", perm: "students.promote" },
  { href: "/admin/academics", label: "শ্রেণি-বিষয়-নিয়োগ", icon: "🏫", perm: "students.read" },
  { href: "/admin/attendance", label: "হাজিরা", icon: "✅", perm: "attendance.read" },
  { href: "/admin/attendance/report", label: "হাজিরা রিপোর্ট", icon: "📈", perm: "attendance.read" },
  { href: "/admin/staff-attendance", label: "স্টাফ হাজিরা", icon: "🕘", perm: "staffattendance.read" },
  { href: "/admin/leave", label: "ছুটি", icon: "🏖️" },
  { href: "/admin/results", label: "পরীক্ষার ফলাফল", icon: "📝", perm: "results.read" },
  { href: "/admin/fees", label: "বেতন ও ফি", icon: "💰", perm: "fees.read" },
  { href: "/admin/accounts", label: "হিসাব নিকাশ", icon: "📊", perm: "accounts.read" },
  { href: "/admin/notices", label: "নোটিশ", icon: "📢", perm: "notices.write" },
  { href: "/admin/staff", label: "শিক্ষক ও স্টাফ", icon: "👩‍🏫", perm: "staff.read" },
  { href: "/admin/settings", label: "সেটিংস", icon: "⚙️", perm: "settings.manage" },
  { href: "/admin/audit", label: "অডিট লগ", icon: "🧾", perm: "audit.read" },
];

export default function AdminShell({ session, schoolName, children }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const items = nav.filter((n) => !n.perm || session.perms.includes(n.perm));
  return (
    <div className="min-h-screen lg:flex print:block">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand px-4 py-3 text-white lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} aria-label="মেনু খুলুন" className="text-2xl">☰</button>
        <span className="font-bold">{schoolName}</span><span className="w-6" />
      </header>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-dark text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-white/10 p-5"><p className="text-lg font-bold">{schoolName}</p><p className="text-sm text-white/70">{session.name} · {roleLabel[session.role]}</p></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="প্রধান মেনু">
          {items.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium ${path === n.href ? "bg-gold text-ink" : "hover:bg-white/10"}`}><span>{n.icon}</span>{n.label}</Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-3">
          <Link href="/" className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">🌐 ওয়েবসাইট দেখুন</Link>
          <LogoutButton className="btn w-full bg-white/10 text-white hover:bg-white/20" />
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 print:p-0">{children}</main>
    </div>
  );
}
