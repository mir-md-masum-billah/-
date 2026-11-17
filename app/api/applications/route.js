import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Application, LoginAttempt } from "@/lib/models";
import { handle, json, ok, bad, esc, HttpError, clientIp } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { isDate, isFuture } from "@/lib/dates";

// পাবলিক: ভর্তির আবেদন জমা (লগইন লাগে না) — হানিপট + আইপি ভিত্তিক সীমা
export const POST = handle(async (req) => {
  await connectDB();
  const b = await req.json();
  if (b.website) return ok(); // বট ধরা পড়লে নীরবে সফল দেখায়, কিছু সংরক্ষণ হয় না
  const ip = clientIp(req);
  const a = await LoginAttempt.findOneAndUpdate({ key: `app|${ip}` }, { $inc: { count: 1 }, $set: { expireAt: new Date(Date.now() + 3600e3) } }, { upsert: true, new: true });
  if (a.count > 5) throw new HttpError(429, "অনেকগুলো আবেদন এসেছে — এক ঘণ্টা পরে চেষ্টা করুন");
  const st = await getSettings();
  const s = (v, n = 120) => String(v ?? "").trim().slice(0, n);
  const d = { name: s(b.name), class: s(b.class), gender: ["male", "female", "other"].includes(b.gender) ? b.gender : undefined, fatherName: s(b.fatherName), motherName: s(b.motherName), phone: s(b.phone, 20).replace(/[\s-]/g, ""), address: s(b.address, 250), previousSchool: s(b.previousSchool), previousClass: s(b.previousClass, 40) };
  if (d.name.length < 2) throw bad("শিক্ষার্থীর নাম দিন");
  if (d.fatherName.length < 2) throw bad("পিতার নাম দিন");
  if (!st.classes.some((c) => c.name === d.class)) throw bad("শ্রেণি বাছাই করুন");
  if (!/^(\+?88)?01[3-9]\d{8}$/.test(d.phone)) throw bad("সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)");
  if (b.dob) { if (!isDate(b.dob) || isFuture(b.dob)) throw bad("জন্ম তারিখ সঠিক নয়"); d.dob = b.dob; }
  const doc = await Application.create(d);
  return ok({ id: doc._id });
});

export const GET = handle(async (req) => {
  await requireUser("applications.manage");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {}; if (sp.get("status")) f.status = sp.get("status");
  const q = (sp.get("q") || "").trim().slice(0, 60);
  if (q) f.$or = [{ name: { $regex: esc(q), $options: "i" } }, { phone: { $regex: esc(q) } }];
  const limit = Math.min(parseInt(sp.get("limit")) || 20, 200), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([Application.countDocuments(f), Application.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});
