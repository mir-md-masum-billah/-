import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { User, Student, LoginAttempt } from "@/lib/models";
import { handle, HttpError, clientIp } from "@/lib/http";

const MAX = 5, LOCK_MIN = 15; // একই আইপি + আইডি: ৫ বার ভুল → ১৫ মিনিট বন্ধ
const MAX_PER_IP = 30; // একই আইপি থেকে যেকোনো আইডিতে ৩০ বার ভুল → ১৫ মিনিট বন্ধ (বিভিন্ন আইডি ঘুরিয়ে চেষ্টা ঠেকায়)
const DUMMY = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.4p9jK1Zx2rJ1Hq1pS7fGJ0v0ZQ8a";
const TOO_MANY = `অনেকবার ভুল চেষ্টা। ${LOCK_MIN} মিনিট পরে আবার চেষ্টা করুন`;

async function check(keys) {
  const rows = await LoginAttempt.find({ key: { $in: keys }, lockedUntil: { $gt: new Date() } }).select("_id").lean();
  if (rows.length) throw new HttpError(429, TOO_MANY);
}
async function fail(key, max) {
  const a = await LoginAttempt.findOneAndUpdate({ key }, { $inc: { count: 1 }, $set: { expireAt: new Date(Date.now() + LOCK_MIN * 60000) } }, { upsert: true, new: true });
  if (a.count >= max) await LoginAttempt.updateOne({ key }, { $set: { lockedUntil: new Date(Date.now() + LOCK_MIN * 60000), count: 0 } });
}

export const POST = handle(async (req) => {
  const { userId, password } = await req.json().catch(() => ({}));
  if (typeof userId !== "string" || typeof password !== "string" || !userId || !password) throw new HttpError(400, "আইডি ও পাসওয়ার্ড দিন");
  if (userId.length > 60 || password.length > 200) throw new HttpError(400, "আইডি বা পাসওয়ার্ড অনেক বড়");
  await connectDB();
  const id = userId.trim();
  const ip = clientIp(req);
  const key = `${ip}|${id.toLowerCase()}`, ipKey = `ip|${ip}`;
  await check([key, ipKey]);

  let u = await User.findOne({ userId: id }).select("+password"), role = u?.role;
  if (!u) { u = await Student.findOne({ studentId: id }).select("+password"); role = "student"; }
  const valid = await bcrypt.compare(password, u?.password || DUMMY); // সময় সমান রাখতে সবসময় compare
  if (!u || !valid || !u.active || u.archived) {
    await Promise.all([fail(key, MAX), fail(ipKey, MAX_PER_IP)]);
    throw new HttpError(401, "আইডি বা পাসওয়ার্ড ভুল");
  }
  await LoginAttempt.deleteOne({ key });

  const token = await signToken({ id: String(u._id), role, name: u.name });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return res;
});
