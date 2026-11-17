"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ResultCardDoc from "@/components/ResultCardDoc";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";

export default function Page() {
  const { x } = useLang(); const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { fetch(`/api/results/card${location.search.replace(/&?print=1/, "")}`).then(async (r) => { const j = await r.json(); r.ok ? setD(j) : setErr(j.error || x("লোড করা যায়নি")); }).catch(() => setErr(x("নেটওয়ার্ক সমস্যা"))); }, []); // eslint-disable-line
  return <div className="min-h-screen bg-pearl p-3 sm:p-6 print:min-h-0 print:bg-white print:p-0">{err ? <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p> : !d ? <Loader compact label={x("লোড হচ্ছে...")} /> : <ResultCardDoc data={d} back={<Link href="/student" className="btn-ghost !py-2">{x("← ফিরে যান")}</Link>} />}</div>;
}
