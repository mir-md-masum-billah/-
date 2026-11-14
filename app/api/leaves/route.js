import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { LeaveApplication } from "@/lib/models";
import { handle, json, ok, bad, HttpError } from "@/lib/http";
import { isDate, todayDhaka, addDays } from "@/lib/dates";
import { audit } from "@/lib/audit";

const populate = [{ path: "user", select: "name userId designation" }, { path: "student", select: "name studentId class roll" }];
async function who() { const u = await currentUser(); if (!u) throw new HttpError(401, "আবার লগইন করুন"); return u; }

// স্টাফ নিজের জন্য, শিক্ষার্থী নিজের জন্য আবেদন করে। অনুমোদনকারী সবার দেখে, অন্যরা শুধু নিজের
export const GET = handle(async (req) => {
  const u = await who(); await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  if (u.role === "student") f.student = u.id;
  else if (!u.perms.includes("leave.approve")) f.user = u.id;
  else { if (sp.get("kind")) f.kind = sp.get("kind"); }
  if (sp.get("status")) f.status = sp.get("status");
  const limit = Math.min(parseInt(sp.get("limit")) || 20, 200), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([LeaveApplication.countDocuments(f), LeaveApplication.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(populate).lean()]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const POST = handle(async (req) => {
  const u = await who(); await connectDB();
  const b = await req.json();
  const today = todayDhaka();
  if (!isDate(b.from) || !isDate(b.to)) throw bad("তারিখ সঠিক নয়");
  if (b.to < b.from) throw bad("শেষ তারিখ শুরুর আগে হতে পারে না");
  if (b.from < addDays(today, -7)) throw bad("৭ দিনের বেশি পুরনো তারিখে আবেদন করা যায় না");
  if (b.to > addDays(b.from, 90)) throw bad("একবারে সর্বোচ্চ ৯০ দিন");
  const reason = String(b.reason || "").trim().slice(0, 500);
  if (reason.length < 3) throw bad("কারণ লিখুন");
  const owner = u.role === "student" ? { kind: "student", student: u.id } : { kind: "staff", user: u.id };
  const overlap = await LeaveApplication.exists({ ...owner, status: { $in: ["pending", "approved"] }, from: { $lte: b.to }, to: { $gte: b.from } });
  if (overlap) throw bad("এই সময়ে আগে থেকেই ছুটির আবেদন আছে");
  const doc = await LeaveApplication.create({ ...owner, from: b.from, to: b.to, reason });
  await audit(u, "apply", "leave", doc._id, { from: b.from, to: b.to });
  return ok({ id: doc._id });
});
