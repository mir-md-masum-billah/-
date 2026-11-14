"use client";
import CrudPage from "@/components/CrudPage";
import { todayDhaka } from "@/lib/dates";

export default function Page() {
  return (
    <CrudPage resource="notices" title="নোটিশ" addLabel="নতুন নোটিশ" defaults={{ date: todayDhaka() }}
      columns={[{ key: "date", label: "তারিখ" }, { key: "title", label: "শিরোনাম" }]}
      fields={[{ key: "title", label: "শিরোনাম", required: true, full: true }, { key: "date", label: "প্রকাশের তারিখ", type: "date" }, { key: "body", label: "বিস্তারিত", type: "textarea" }, { key: "fileUrl", label: "ফাইল/ছবি (ঐচ্ছিক)", type: "file" }]} />
  );
}
