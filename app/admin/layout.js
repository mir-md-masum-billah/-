import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }) {
  const u = await currentUser(); // ডেটাবেজ থেকে যাচাই: নিষ্ক্রিয় হলে সরাসরি লগইনে
  if (!u) redirect("/login");
  if (u.role === "student" || u.role === "parent") redirect("/student");
  const st = await getSettings();
  return <AdminShell session={{ name: u.name, role: u.role, perms: u.perms }} schoolName={st.schoolName}>{children}</AdminShell>;
}
