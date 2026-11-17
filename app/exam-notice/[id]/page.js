"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import ExamNoticeDoc from "@/components/ExamNoticeDoc";
import useSchool from "@/hooks/useSchool";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";

export default function Page({ params }) {
  const { id } = use(params); const { x } = useLang(); const school = useSchool();
  const [e, setE] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { fetch(`/api/public/exam-notices/${id}`).then(async (r) => { const j = await r.json(); r.ok ? setE(j) : setErr(j.error || x("নোটিশ পাওয়া যায়নি")); }).catch(() => setErr(x("নেটওয়ার্ক সমস্যা"))); }, [id]);
  return <div className="min-h-screen bg-pearl p-3 sm:p-6 print:min-h-0 print:bg-white print:p-0">{err ? <p className="mx-auto max-w-xl rounded-lg bg-red-50 p-4 text-red-700">{err}</p> : !e || !school ? <Loader compact label={x("লোড হচ্ছে...")} /> : <ExamNoticeDoc exam={e} school={school} back={<Link href="/" className="btn-ghost !py-2">{x("← হোমপেজ")}</Link>} />}</div>;
}
