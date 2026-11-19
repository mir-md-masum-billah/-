"use client";
import CrudPage from "@/components/CrudPage";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";
import { useState } from "react";
import StudentListPrint from "@/components/StudentListPrint";

export default function Page() {
  const st = useSettings(); const me = useMe(); const { x, money } = useLang();
  const [cls, setCls] = useState(""); const [pr, setPr] = useState(false); const [arch, setArch] = useState(false); const [rv, setRv] = useState(0);
  if (!st || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const classOpts = st.classes.map((c) => c.name);
  const chip = (on) => `shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${on ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-700"}`;
  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist"><button className={chip(!cls)} onClick={() => setCls("")}>{x("সব শিক্ষার্থী")}</button>{classOpts.map((c) => <button key={c} className={chip(cls === c)} onClick={() => setCls(c)}>{x(c)}</button>)}<button className={`${chip(arch)} ml-auto`} onClick={() => setArch(!arch)}>{arch ? x("← সক্রিয় তালিকা") : x("আর্কাইভ তালিকা")}</button></div>
      {arch && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{x("আর্কাইভ করা শিক্ষার্থীরা এখানে আছে। \"ফিরিয়ে আনুন\" চাপলে আবার সক্রিয় হবে ও লগইন চালু হবে।")}</p>}
    <CrudPage
      prefill={async () => { const r = await fetch("/api/next-id?kind=student"); const j = await r.json(); return j.id ? { studentId: j.id } : {}; }}
      key={`${cls}|${arch}|${rv}`} query={`${cls ? `&class=${encodeURIComponent(cls)}` : ""}${arch ? "&archived=true" : ""}`}
      resource="students" title={arch ? "আর্কাইভ করা শিক্ষার্থী" : "শিক্ষার্থী"} addLabel="নতুন ভর্তি" canWrite={me.perms.includes("students.write") && !arch}
      toolbar={<><button className="btn-ghost !py-2" onClick={() => setPr(true)}>{x("বিস্তারিত তালিকা প্রিন্ট")}</button>{me.perms.includes("students.promote") && <Link href="/admin/promotion" className="btn-ghost !py-2">{x("প্রমোশন")}</Link>}{me.perms.includes("students.write") && <Link href="/admin/students/import" className="btn-ghost !py-2">{x("আমদানি")}</Link>}<a href="/api/students/export" className="btn-ghost !py-2">{x("এক্সপোর্ট CSV")}</a></>}
      rowActions={(r) => <><Link href={`/admin/students/${r._id}`} className="mr-3 font-semibold text-slate-700">{x("প্রোফাইল")}</Link>{arch && me.perms.includes("students.write") && <button className="mr-3 font-semibold text-brand underline" onClick={async () => { const res = await fetch(`/api/students/${r._id}/restore`, { method: "POST" }); const j = await res.json().catch(() => ({})); if (!res.ok) return alert(j.error || x("সমস্যা হয়েছে")); setRv((v) => v + 1); }}>{x("ফিরিয়ে আনুন")}</button>}</>}
      deleteLabel="আর্কাইভ" deleteConfirm="শিক্ষার্থীকে আর্কাইভ করবেন? লগইন বন্ধ হবে, কিন্তু হাজিরা-ফি-ফলাফলের ইতিহাস থাকবে।"
      defaults={{ active: "true", session: st.currentSession || "", class: cls }}
      columns={[
        { label: "ছবি", render: (r) => (r.photo ? <img src={r.photo} alt="" width={40} height={40} style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, flex: "none", maxWidth: "none", borderRadius: "50%", objectFit: "cover", display: "block", aspectRatio: "1 / 1" }} /> : "—") },
        { key: "studentId", label: "আইডি" }, { key: "name", label: "নাম" },
        { label: "শ্রেণি", render: (r) => `${x(r.class)}${r.section ? " (" + r.section + ")" : ""}` }, { key: "roll", label: "রোল" },
        { key: "phone", label: "মোবাইল" }, { label: "মাসিক বেতন", render: (r) => money(r.monthlyFee) },
        { label: "অবস্থা", render: (r) => (r.active ? x("সক্রিয়") : x("নিষ্ক্রিয়")) },
      ]}
      fields={[
        { key: "studentId", label: "শিক্ষার্থী আইডি (স্বয়ংক্রিয় — বদলানো যাবে)" },
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
      {pr && <StudentListPrint cls={cls} onClose={() => setPr(false)} />}
    </div>
  );
}
