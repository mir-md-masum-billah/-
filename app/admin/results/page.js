"use client";
import CrudPage from "@/components/CrudPage";
import useMe from "@/hooks/useMe";
import { useLang } from "@/components/LangProvider";
import { yearDhaka } from "@/lib/dates";
import Loader from "@/components/Loader";

export default function Page() {
  const me = useMe(); const { x, n } = useLang();
  if (!me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  return (
    <CrudPage
      resource="results" title="পরীক্ষার ফলাফল" addLabel="নম্বর যোগ" canWrite={me.perms.includes("results.write")} deleteConfirm="নম্বর মুছবেন? (অডিট লগে আগের মান থাকবে)"
      defaults={{ year: yearDhaka(), full: 100 }}
      columns={[
        { label: "শিক্ষার্থী", render: (r) => (r.student ? `${r.student.name} (${x(r.student.class)}-${n(r.student.roll)})` : "—") },
        { key: "exam", label: "পরীক্ষা" }, { key: "year", label: "বছর" }, { key: "subject", label: "বিষয়" },
        { label: "প্রাপ্ত নম্বর", render: (r) => `${n(r.marks)} / ${n(r.full)}` }, { label: "সংশোধন", render: (r) => (r.history?.length ? x("{0} বার", r.history.length) : "—") },
      ]}
      fields={[
        { key: "student", label: "শিক্ষার্থী", ref: "students", required: true, full: true },
        { key: "exam", label: "পরীক্ষার নাম (যেমন: অর্ধবার্ষিক)", required: true }, { key: "year", label: "বছর", type: "number", required: true },
        { key: "subject", label: "বিষয়", required: true }, { key: "marks", label: "প্রাপ্ত নম্বর", type: "number", min: 0, step: "0.5", required: true },
        { key: "full", label: "পূর্ণমান", type: "number", min: 1 },
      ]}
    />
  );
}
