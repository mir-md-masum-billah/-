import { currentUser } from "@/lib/guard";

// পাবলিক পেজের জন্য: লগইন করা থাকলে তার ড্যাশবোর্ডের ঠিকানা ("/admin" বা "/student"), না থাকলে null
export async function getDashboardHref() {
  try {
    const u = await currentUser();
    if (!u) return null;
    return u.role === "student" ? "/student" : "/admin";
  } catch { return null; }
}
