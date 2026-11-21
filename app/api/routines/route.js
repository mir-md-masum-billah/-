import { connectDB } from "@/lib/db";
import { currentUser, requireUser } from "@/lib/guard";
import { RoutineSlot } from "@/lib/models";
import { handle, json, ok, HttpError, isId } from "@/lib/http";
import { validateSlot } from "@/lib/routine";
import { audit } from "@/lib/audit";
import { safeSync } from "@/lib/routine-sync";

// অ্যাডমিন (routine.manage) সব দেখে; শিক্ষক শুধু নিজের রুটিন
export const GET = handle(async (req) => {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  if (u.role === "student") throw new HttpError(403, "অনুমতি নেই");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  // ?mine=1 = শুধু নিজের রুটিন ("আমার রুটিন") — অ্যাডমিন হলেও অন্যের ক্লাস আসবে না
  if (sp.get("mine") === "1") { if (!["teacher", "headmaster", "admin", "superadmin"].includes(u.role)) throw new HttpError(403, "অনুমতি নেই"); f.teacher = u.id; }
  else if (u.perms.includes("routine.manage")) {
    if (isId(sp.get("teacher") || "")) f.teacher = sp.get("teacher");
    if (sp.get("class")) f.class = sp.get("class");
    if (sp.get("section")) f.section = sp.get("section");
  } else if (["teacher", "headmaster", "admin", "superadmin"].includes(u.role)) f.teacher = u.id;
  else throw new HttpError(403, "অনুমতি নেই");
  const items = await RoutineSlot.find(f).sort({ day: 1, startTime: 1 }).populate("teacher", "name userId").lean();
  return json({ items });
});

export const POST = handle(async (req) => {
  const user = await requireUser("routine.manage");
  await connectDB();
  const d = await validateSlot(await req.json());
  const doc = await RoutineSlot.create(d);
  await audit(user, "create", "routine", doc._id, { class: d.class, section: d.section, subject: d.subject, day: d.day, time: `${d.startTime}-${d.endTime}`, teacher: String(d.teacher) });
  await safeSync(d.class, d.section); // প্রথম ক্লাসের স্যার = ক্লাস টিচার, বাকিরা বিষয় শিক্ষক
  return ok({ id: doc._id });
});
