"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AllExamsDoc } from "@/components/ExamNoticeDoc";
import useSchool from "@/hooks/useSchool";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";

export default function Page() {
  const { x } = useLang(); const school = useSchool(); const [items, setItems] = useState(null);
  useEffect(() => { fetch("/api/public/exam-notices").then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => setItems([])); }, []);
  const sorted = items && [...items].sort((a, b) => a.class.localeCompare(b.class, "bn") || (a.section || "").localeCompare(b.section || ""));
  return <div className="min-h-screen bg-pearl p-3 sm:p-6 print:min-h-0 print:bg-white print:p-0">{!sorted || !school ? <Loader compact label={x("লোড হচ্ছে...")} /> : sorted.length === 0 ? <p className="mx-auto max-w-xl rounded-lg bg-white p-4 text-center">{x("এখন কোনো পরীক্ষার নোটিশ নেই")}</p> : <AllExamsDoc exams={sorted} school={school} back={<Link href="/" className="btn-ghost !py-2">{x("← হোমপেজ")}</Link>} />}</div>;
}
