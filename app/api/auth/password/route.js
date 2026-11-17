import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { User, Student, LoginAttempt } from "@/lib/models";
import { handle, ok, bad, HttpError, clientIp } from "@/lib/http";
import { audit } from "@/lib/audit";

// নিজের পাসওয়ার্ড বদলানো (স্টাফ ও শিক্ষার্থী) — বর্তমান পাসওয়ার্ড লাগে; ভুল চেষ্টায় সীমা আছে
export const POST = handle(async (req) => {
  const me = await requireUser();
  const { current, next } = await req.json().catch(() => ({}));
  if (typeof current !== "string" || typeof next !== "string" || !current) throw bad("বর্তমান ও নতুন পাসওয়ার্ড দিন");
  if (next.length < 8 || next.length > 100) throw bad("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
  if (next === current) throw bad("নতুন পাসওয়ার্ড আগেরটির মতো হতে পারে না");
  await connectDB();

  const key = `pw|${me.id}`;
  const lock = await LoginAttempt.findOne({ key, lockedUntil: { $gt: new Date() } }).lean();
  if (lock) throw new HttpError(429, "অনেকবার ভুল চেষ্টা। ১৫ মিনিট পরে আবার চেষ্টা করুন");

  const Model = me.role === "student" ? Student : User;
  const doc = await Model.findById(me.id).select("+password");
  if (!doc || !(await bcrypt.compare(current, doc.password))) {
    const a = await LoginAttempt.findOneAndUpdate({ key }, { $inc: { count: 1 }, $set: { expireAt: new Date(Date.now() + 15 * 60000) } }, { upsert: true, new: true });
    if (a.count >= 5) await LoginAttempt.updateOne({ key }, { $set: { lockedUntil: new Date(Date.now() + 15 * 60000), count: 0 } });
    throw bad("বর্তমান পাসওয়ার্ড ভুল");
  }
  doc.password = await bcrypt.hash(next, 10);
  await doc.save();
  await LoginAttempt.deleteOne({ key });
  await audit(me, "password_change", me.role === "student" ? "students" : "staff", me.id, { name: me.name, ip: clientIp(req) });
  return ok();
});
