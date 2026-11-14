"use client";
import CrudPage from "@/components/CrudPage";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import Link from "next/link";
import { money } from "@/lib/school";

export default function Page() {
  const st = useSettings(); const me = useMe();
  if (!st || !me) return <p>লোড হচ্ছে...</p>;
  const classOpts = st.classes.map((c) => c.name);
  return (
    <CrudPage
      resource="students" title="শিক্ষার্থী" addLabel="নতুন ভর্তি" canWrite={me.perms.includes("students.write")}
      toolbar={<>{me.perms.includes("students.promote") && <Link href="/admin/promotion" className="btn-ghost !py-2">প্রমোশন</Link>}{me.perms.includes("students.write") && <Link href="/admin/students/import" className="btn-ghost !py-2">আমদানি</Link>}<a href="/api/students/export" className="btn-ghost !py-2">এক্সপোর্ট CSV</a></>}
      rowActions={(r) => <Link href={`/admin/students/${r._id}`} className="mr-3 font-semibold text-slate-700">প্রোফাইল</Link>}
      deleteLabel="আর্কাইভ" deleteConfirm="শিক্ষার্থীকে আর্কাইভ করবেন? লগইন বন্ধ হবে, কিন্তু হাজিরা-ফি-ফলাফলের ইতিহাস থাকবে।"
      defaults={{ active: "true", session: st.currentSession || "" }}
      columns={[
        { label: "ছবি", render: (r) => (r.photo ? <img src={r.photo} alt="" className="h-9 w-9 rounded-full object-cover" /> : "—") },
        { key: "studentId", label: "আইডি" }, { key: "name", label: "নাম" },
        { label: "শ্রেণি", render: (r) => `${r.class}${r.section ? " (" + r.section + ")" : ""}` }, { key: "roll", label: "রোল" },
        { key: "phone", label: "মোবাইল" }, { label: "মাসিক বেতন", render: (r) => money(r.monthlyFee) },
        { label: "অবস্থা", render: (r) => (r.active ? "সক্রিয়" : "নিষ্ক্রিয়") },
      ]}
      fields={[
        { key: "studentId", label: "শিক্ষার্থী আইডি (ফাঁকা = স্বয়ংক্রিয়)" },
        { key: "password", label: "পাসওয়ার্ড (ফাঁকা = স্বয়ংক্রিয়)", type: "password" },
        { key: "name", label: "নাম", required: true },
        { key: "class", label: "শ্রেণি", type: "select", options: classOpts, required: true, resets: { section: "" } },
        { key: "section", label: "শাখা", type: "select", options: (f) => st.classes.find((c) => c.name === f.class)?.sections || [] },
        { key: "roll", label: "রোল (ফাঁকা = স্বয়ংক্রিয়)", type: "number", min: 1 },
        { key: "session", label: "শিক্ষাবর্ষ (যেমন ২০২৬)" },
        { key: "gender", label: "লিঙ্গ", type: "select", options: [{ value: "male", label: "ছেলে" }, { value: "female", label: "মেয়ে" }, { value: "other", label: "অন্যান্য" }] },
        { key: "fatherName", label: "পিতার নাম" }, { key: "motherName", label: "মাতার নাম" },
        { key: "guardianName", label: "অভিভাবকের নাম" }, { key: "guardianPhone", label: "অভিভাবকের মোবাইল" },
        { key: "phone", label: "মোবাইল" }, { key: "otherPhones", label: "অন্যান্য ফোন (কমা দিয়ে)", render: undefined }, { key: "birthRegNo", label: "জন্মনিবন্ধন নং" },
        { key: "previousSchool", label: "আগের স্কুল" }, { key: "previousClass", label: "আগের শ্রেণি" },
        { key: "dob", label: "জন্ম তারিখ", type: "date" }, { key: "admissionDate", label: "ভর্তির তারিখ", type: "date" },
        { key: "monthlyFee", label: "মাসিক বেতন (৳)", type: "number", min: 0 },
        { key: "address", label: "ঠিকানা", full: true },
        { key: "photo", label: "ছবি", type: "file" },
        { key: "active", label: "অবস্থা", type: "select", options: [{ value: "true", label: "সক্রিয়" }, { value: "false", label: "নিষ্ক্রিয়" }] },
      ]}
    />
  );
}
