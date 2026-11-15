"use client";
import { useState } from "react";
import CrudPage from "@/components/CrudPage";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import { useLang } from "@/components/LangProvider";
import Loader from "@/components/Loader";

export default function Academics() {
  const st = useSettings(); const me = useMe(); const { x } = useLang(); const [tab, setTab] = useState("assign");
  if (!st || !me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  const w = me.perms.includes("academics.manage"); const classes = st.classes.map((c) => c.name);
  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto border-b">{[["assign", "শিক্ষক নিয়োগ"], ["subject", "বিষয়"], ["session", "একাডেমিক সেশন"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap px-4 py-2 font-semibold ${tab === k ? "border-b-4 border-gold text-brand" : "text-slate-600"}`}>{x(l)}</button>)}</div>
      {tab === "assign" && <>
        <p className="mb-3 rounded-lg bg-brand-light p-3 text-sm">{x("ক্লাস টিচার নিজের শ্রেণির হাজিরা ও সব বিষয়ের নম্বর দিতে পারেন। বিষয় শিক্ষক শুধু সেই শ্রেণির নিজের বিষয়ের নম্বর দিতে পারেন। নিয়োগ ছাড়া শিক্ষক কিছুই দেখেন না (সেটিংসে এই সীমা বন্ধ করা যায়)।")}</p>
        <CrudPage key="a" resource="assignments" title="শিক্ষক নিয়োগ" addLabel="নতুন নিয়োগ" canWrite={w} deleteConfirm="নিয়োগ সরাবেন?"
          defaults={{ kind: "class" }}
          columns={[{ label: "শিক্ষক", render: (r) => r.teacher?.name }, { label: "ধরন", render: (r) => (r.kind === "class" ? x("ক্লাস টিচার") : x("বিষয় শিক্ষক")) }, { key: "class", label: "শ্রেণি" }, { label: "শাখা", render: (r) => r.section || x("সব") }, { label: "বিষয়", render: (r) => r.subject?.name || "—" }]}
          fields={[
            { key: "teacher", label: "শিক্ষক", ref: "staff", refQuery: "&role=teacher&active=true", refLabel: (o) => `${o.name} (${o.userId})`, required: true, full: true },
            { key: "kind", label: "ধরন", type: "select", required: true, options: [{ value: "class", label: "ক্লাস টিচার" }, { value: "subject", label: "বিষয় শিক্ষক" }] },
            { key: "class", label: "শ্রেণি", type: "select", options: classes, required: true, resets: { section: "" } },
            { key: "section", label: "শাখা (ফাঁকা = সব)", type: "select", options: (f) => st.classes.find((c) => c.name === f.class)?.sections || [] },
            { key: "subject", label: "বিষয় (বিষয় শিক্ষকের জন্য)", ref: "subjects", refQuery: "", refLabel: (o) => o.name },
          ]} />
      </>}
      {tab === "subject" && <CrudPage key="s" resource="subjects" title="বিষয়" addLabel="নতুন বিষয়" canWrite={w} defaults={{ type: "compulsory", fullMarks: 100 }}
        columns={[{ key: "name", label: "বিষয়" }, { key: "code", label: "কোড" }, { label: "ধরন", render: (r) => (r.type === "optional" ? x("ঐচ্ছিক") : x("বাধ্যতামূলক")) }, { label: "শ্রেণি", render: (r) => (r.classes?.length ? r.classes.map((c) => x(c)).join(", ") : x("সব")) }, { key: "fullMarks", label: "পূর্ণমান" }]}
        fields={[{ key: "name", label: "বিষয়ের নাম", required: true }, { key: "code", label: "কোড" }, { key: "type", label: "ধরন", type: "select", options: [{ value: "compulsory", label: "বাধ্যতামূলক" }, { value: "optional", label: "ঐচ্ছিক" }] }, { key: "fullMarks", label: "পূর্ণমান", type: "number", min: 1 }, { key: "classes", label: "শ্রেণি (কমা দিয়ে; ফাঁকা = সব)", full: true }]} />}
      {tab === "session" && <CrudPage key="e" resource="sessions" title="একাডেমিক সেশন" addLabel="নতুন সেশন" canWrite={w} defaults={{ current: "false" }}
        columns={[{ key: "name", label: "সেশন" }, { key: "startDate", label: "শুরু" }, { key: "endDate", label: "শেষ" }, { label: "চলতি", render: (r) => (r.current ? x("চলতি") : "—") }]}
        fields={[{ key: "name", label: "নাম (যেমন ২০২৬)", required: true }, { key: "startDate", label: "শুরুর তারিখ", type: "date", required: true }, { key: "endDate", label: "শেষের তারিখ", type: "date", required: true }, { key: "current", label: "চলতি সেশন?", type: "select", options: [{ value: "true", label: "হ্যাঁ" }, { value: "false", label: "না" }] }]} />}
    </div>
  );
}
