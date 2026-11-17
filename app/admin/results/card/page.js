"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ResultCardDoc from "@/components/ResultCardDoc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";

export default function Page() {
  const { x } = useLang(); const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/results/card${location.search.replace(/&?print=1/, "")}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error || x("লোড করা যায়নি")))); }, []); // eslint-disable-line
  return <div>{err ? <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p> : !d ? <Loader compact label={x("লোড হচ্ছে...")} /> : <ResultCardDoc data={d} back={<Link href="/admin/results" className="btn-ghost !py-2">{x("← ফলাফল")}</Link>} />}</div>;
}
