import { connectDB } from "@/lib/db";
import { getTokenPayload } from "@/lib/auth";
import { User, Student, Assignment } from "@/lib/models";
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
  const perms = resolvePerms(u.role, st.rolePermissions, st.permsKnown);
  const out = { id: String(u._id), name: u.name, role: u.role, perms };
  // ক্লাস টিচার (রুটিনের প্রথম ক্লাসের স্যার) নিজের শ্রেণির প্রমোশন দিতে পারেন — আলাদা অনুমতি "promote.own", শুধু নিজের শ্রেণি/শাখার জন্য
  if (u.role === "teacher") {
    const mine = await Assignment.find({ teacher: u._id, kind: "class" }).select("class section").lean();
    out.classTeacherOf = mine.map((a) => ({ class: a.class, section: a.section || "" }));
    if (mine.length && !perms.includes("students.promote")) out.perms = [...perms, "promote.own"];
  }
  return out;
}
// প্রমোশন: পূর্ণ অনুমতিধারী (students.promote) সব শ্রেণির; ক্লাস টিচার শুধু নিজের শ্রেণি/শাখার
export function assertPromote(u, cls, section) {
  if (u.perms.includes("students.promote")) return;
  const ok = u.perms.includes("promote.own") && (u.classTeacherOf || []).some((c) => c.class === cls && (!c.section || c.section === (section || "")));
  if (!ok) throw new HttpError(403, "এই শ্রেণির প্রমোশন দেওয়ার অনুমতি নেই — শুধু ক্লাস টিচার নিজের শ্রেণির প্রমোশন দিতে পারেন");
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
