import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { User, Student, LoginAttempt } from "@/lib/models";
import { handle, HttpError } from "@/lib/http";

const MAX = 5, LOCK_MIN = 15;
const DUMMY = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.4p9jK1Zx2rJ1Hq1pS7fGJ0v0ZQ8a";

async function check(key) {
  const a = await LoginAttempt.findOne({ key });
  if (a?.lockedUntil && a.lockedUntil > new Date()) throw new HttpError(429, `অনেকবার ভুল চেষ্টা। ${LOCK_MIN} মিনিট পরে আবার চেষ্টা করুন`);
}
async function fail(key) {
  const a = await LoginAttempt.findOneAndUpdate({ key }, { $inc: { count: 1 }, $set: { expireAt: new Date(Date.now() + LOCK_MIN * 60000) } }, { upsert: true, new: true });
  if (a.count >= MAX) await LoginAttempt.updateOne({ key }, { $set: { lockedUntil: new Date(Date.now() + LOCK_MIN * 60000), count: 0 } });
}

export const POST = handle(async (req) => {
  const { userId, password } = await req.json();
  if (typeof userId !== "string" || typeof password !== "string" || !userId || !password) throw new HttpError(400, "আইডি ও পাসওয়ার্ড দিন");
  await connectDB();
  const id = userId.trim();
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const key = `${ip}|${id.toLowerCase()}`;
  await check(key);

  let u = await User.findOne({ userId: id }).select("+password"), role = u?.role;
  if (!u) { u = await Student.findOne({ studentId: id }).select("+password"); role = "student"; }
  const valid = await bcrypt.compare(password, u?.password || DUMMY); // সময় সমান রাখতে সবসময় compare
  if (!u || !valid || !u.active || u.archived) { await fail(key); throw new HttpError(401, "আইডি বা পাসওয়ার্ড ভুল"); }
  await LoginAttempt.deleteOne({ key });

  const token = await signToken({ id: String(u._id), role, name: u.name });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return res;
});
