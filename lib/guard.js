import { connectDB } from "@/lib/db";
import { getTokenPayload } from "@/lib/auth";
import { User, Student } from "@/lib/models";
import { HttpError } from "@/lib/http";
import { resolvePerms } from "@/lib/rbac";
import { getSettings } from "@/lib/settings";

// প্রতিটি অনুরোধে ডেটাবেজ থেকে ব্যবহারকারী যাচাই: নিষ্ক্রিয়/আর্কাইভ/মুছে ফেলা হলে সেশন অচল, রোল বদলালে নতুন রোল প্রযোজ্য
export async function currentUser() {
  const t = await getTokenPayload();
  if (!t) return null;
  await connectDB();
  if (t.role === "student") {
    const s = await Student.findById(t.id).select("name active archived").lean();
    if (!s || !s.active || s.archived) return null;
    return { id: String(s._id), name: s.name, role: "student", perms: [] };
  }
  const u = await User.findById(t.id).select("name role active").lean();
  if (!u || !u.active) return null;
  const st = await getSettings();
  return { id: String(u._id), name: u.name, role: u.role, perms: resolvePerms(u.role, st.rolePermissions, st.permsKnown) };
}

// perm না দিলে শুধু লগইন যথেষ্ট; perm দিলে সেই অনুমতি লাগবে (সার্ভারে সবসময় যাচাই)
export async function requireUser(perm) {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  if (perm && !u.perms.includes(perm)) throw new HttpError(403, "এই কাজের অনুমতি নেই");
  return u;
}
export async function requireStudent() {
  const u = await currentUser();
  if (!u || u.role !== "student") throw new HttpError(401, "আবার লগইন করুন");
  return u;
}
