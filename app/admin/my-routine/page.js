"use client";
import { useEffect, useState } from "react";
import RoutineSheet from "@/components/RoutineSheet";
import Loader from "@/components/Loader";
import useMe from "@/hooks/useMe";
import { api } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";

export default function MyRoutine() {
  const { x } = useLang(); const me = useMe(); const [items, setItems] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("GET", "/api/routines?mine=1").then((r) => (r.ok ? setItems(r.d.items) : setErr(r.d.error || x("লোড করা যায়নি")))); }, []);
  if (err) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{err}</p>;
  if (!items || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  return <div><h1 className="mb-4 text-3xl text-brand-dark no-print">{x("আমার ক্লাস রুটিন")}</h1>{items.length === 0 ? <p className="card text-slate-500">{x("আপনার নামে রুটিনে কোনো ক্লাস দেওয়া হয়নি।")}</p> : <RoutineSheet items={items} mode="teacher" heading={me.name} filename={`routine-${me.name}`} />}</div>;
}
