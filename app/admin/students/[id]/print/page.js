"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import StudentProfileDoc from "@/components/StudentProfileDoc";
import { api } from "@/components/CrudPage";
import Loader from "@/components/Loader";
import { useLang } from "@/components/LangProvider";

export default function Page({ params }) {
  const { id } = use(params); const { x } = useLang();
  const [d, setD] = useState(null); const [err, setErr] = useState(""); const [mode, setMode] = useState("profile");
  useEffect(() => { setMode(new URLSearchParams(location.search).get("mode") === "pay" ? "pay" : "profile"); api("GET", `/api/students/${id}/profile`).then(async (r) => { if (!r.ok) return setErr(r.d.error || x("লোড করা যায়নি")); const sub = await api("GET", `/api/subjects?limit=500`); const ex = (r.d.student.excludedSubjects || []).map(String); setD({ ...r.d, subjects: (sub.ok ? sub.d.items : []).filter((o) => (!o.classes?.length || o.classes.includes(r.d.student.class)) && (o.type !== "optional" || (r.d.student.optionalSubjects || []).some((q) => String(q._id) === String(o._id))) && !ex.includes(String(o._id))) }); }); }, [id]); // eslint-disable-line
  return <div>{err ? <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p> : !d ? <Loader compact label={x("লোড হচ্ছে...")} /> : <StudentProfileDoc student={d.student} payments={d.payments || []} subjects={d.subjects} due={d.due} mode={mode} back={<Link href={`/admin/students/${id}`} className="btn-ghost !py-2">{x("← প্রোফাইল")}</Link>} />}</div>;
}
