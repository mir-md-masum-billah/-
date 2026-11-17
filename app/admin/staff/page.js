"use client";
import CrudPage from "@/components/CrudPage";
import useMe from "@/hooks/useMe";
import { useLang } from "@/components/LangProvider";
import { roleLabel, STAFF_ROLES, canAssignRole } from "@/lib/rbac";
import Loader from "@/components/Loader";

export default function Page() {
  const me = useMe(); const { x } = useLang();
  if (!me) return <Loader compact label={x("লোড হচ্ছে...")} />;
  return (
    <CrudPage
      resource="staff" title="শিক্ষক ও স্টাফ" addLabel="নতুন স্টাফ" canWrite={me.perms.includes("staff.write")}
      deleteLabel="নিষ্ক্রিয়" deleteConfirm="নিষ্ক্রিয় করলে লগইন বন্ধ হবে (ডেটা থাকবে)। নিশ্চিত?"
      defaults={{ role: "teacher", active: "true" }}
      prefill={async () => { const r = await fetch("/api/next-id?kind=staff"); const j = await r.json(); return j.id ? { userId: j.id } : {}; }}
      columns={[{ key: "userId", label: "আইডি" }, { key: "name", label: "নাম" }, { label: "পদ", render: (r) => x(roleLabel[r.role]) }, { key: "designation", label: "পদবি" }, { key: "subject", label: "বিষয়" }, { key: "phone", label: "মোবাইল" }, { label: "অবস্থা", render: (r) => (r.active ? x("সক্রিয়") : x("নিষ্ক্রিয়")) }]}
      fields={[
        { key: "userId", label: "লগইন আইডি (স্বয়ংক্রিয় — বদলানো যাবে)", required: true },
        { key: "password", label: "পাসওয়ার্ড (কমপক্ষে ৬)", type: "password", required: true },
        { key: "name", label: "নাম", required: true },
        { key: "role", label: "রোল", type: "select", required: true, options: STAFF_ROLES.filter((r) => canAssignRole(me.role, r)).map((r) => ({ value: r, label: roleLabel[r] })) },
        { key: "designation", label: "পদবি" }, { key: "department", label: "বিভাগ" }, { key: "subject", label: "বিষয়" }, { key: "phone", label: "মোবাইল" },
        { key: "joiningDate", label: "যোগদানের তারিখ", type: "date" }, { key: "salary", label: "মাসিক বেতন (৳)", type: "number", min: 0 },
        { key: "photo", label: "ছবি", type: "file" },
        { key: "active", label: "অবস্থা", type: "select", options: [{ value: "true", label: "সক্রিয়" }, { value: "false", label: "নিষ্ক্রিয়" }] },
      ]}
    />
  );
}
