import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
export const dynamic = "force-dynamic";
export default async function StudentLayout({ children }) {
  const u = await currentUser();
  if (!u || u.role !== "student") redirect("/login");
  return children;
}
