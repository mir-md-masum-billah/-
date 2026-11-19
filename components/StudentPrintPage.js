"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StudentProfileDoc from "./StudentProfileDoc";
import ResultCardDoc from "./ResultCardDoc";
import { DocBundle } from "./A4Doc";
import { api } from "./CrudPage";
import Loader from "./Loader";
import { useLang } from "./LangProvider";
import { docName, studentTag } from "@/lib/docname";

// একজন শিক্ষার্থীর প্রিন্ট: ?parts=profile,pay,results (একটি, দুটি বা তিনটিই একসাথে)  &year=২০২৬ (শুধু সেই বছরের ফল)  &exam=নাম&year= (একটি পরীক্ষা)
// admin=true → /admin/students/[id]/print (শিক্ষক/অ্যাডমিন), নইলে /student/print (শিক্ষার্থী নিজে)
export default function StudentPrintPage({ admin = false, id }) {
  const { x, n, lang } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const [d, setD] = useState(null); const [cards, setCards] = useState([]); const [err, setErr] = useState(""); const [q, setQ] = useState(null);
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const legacy = sp.get("mode") === "pay" ? ["pay"] : null;
    const parts = (sp.get("parts") ? sp.get("parts").split(",") : legacy || ["profile"]).filter((p) => ["profile", "pay", "results"].includes(p));
    const qq = { parts, year: sp.get("year") || "", exam: sp.get("exam") || "" }; setQ(qq);
    (async () => {
      let base;
      if (admin) {
        const r = await api("GET", `/api/students/${id}/profile`); if (!r.ok) return setErr(r.d.error || x("লোড করা যায়নি"));
        const sub = await api("GET", `/api/subjects?limit=500`); const ex = (r.d.student.excludedSubjects || []).map(String);
        base = { ...r.d, subjects: (sub.ok ? sub.d.items : []).filter((o) => (!o.classes?.length || o.classes.includes(r.d.student.class)) && (o.type !== "optional" || (r.d.student.optionalSubjects || []).some((z) => String(z._id) === String(o._id))) && !ex.includes(String(o._id))) };
      } else {
        const r = await fetch("/api/student/me"); const j = await r.json(); if (!r.ok) return setErr(j.error || x("লোড করা যায়নি")); base = { ...j, subjects: j.subjectsList || [] };
      }
      if (parts.includes("results")) {
        const u = `/api/results/cards?${admin ? `student=${id}&` : ""}${qq.year ? `year=${qq.year}&` : ""}${qq.exam ? `exam=${encodeURIComponent(qq.exam)}` : ""}`;
        const r = await fetch(u); const j = await r.json(); if (r.ok) setCards(j.cards || []);
      }
      setD(base);
    })().catch(() => setErr(x("নেটওয়ার্ক সমস্যা")));
  }, []); // eslint-disable-line
  const back = <Link href={admin ? `/admin/students/${id}` : "/student"} className="btn-ghost !py-2">{admin ? x("← প্রোফাইল") : x("← ফিরে যান")}</Link>;
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d || !q) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const s = d.student, payments = d.payments || [];
  const names = { profile: L("প্রোফাইল", "Profile"), pay: L("পেমেন্ট ইতিহাস", "Payment History"), results: q.exam ? `${L("রেজাল্ট কার্ড", "Result Card")} ${q.exam} ${q.year}` : q.year ? `${L("সব রেজাল্ট", "All Results")} ${q.year}` : L("সব রেজাল্ট", "All Results") };
  const title = docName([studentTag(s, { x, n, lang }), q.parts.length === 3 ? L("সম্পূর্ণ তথ্য (প্রোফাইল, পেমেন্ট ও ফলাফল)", "Complete record") : q.parts.map((p) => names[p]).join(" + ")]);
  return (
    <div className={admin ? "" : "min-h-screen bg-pearl p-3 sm:p-6 print:min-h-0 print:bg-white print:p-0"}>
      <DocBundle docTitle={title} back={back}>
        {q.parts.includes("profile") && <StudentProfileDoc multi student={s} subjects={d.subjects} mode="profile" />}
        {q.parts.includes("pay") && <StudentProfileDoc multi student={s} payments={payments} due={d.due} mode="pay" />}
        {q.parts.includes("results") && (cards.length ? cards.map((c) => <ResultCardDoc multi key={`${c.exam}-${c.year}`} data={c} />) : <p className="no-print mx-auto max-w-[840px] rounded-lg bg-amber-50 p-4 text-amber-900">{x("এই শিক্ষার্থীর কোনো ফলাফল পাওয়া যায়নি")}</p>)}
      </DocBundle>
    </div>
  );
}
