import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { RoutineSlot } from "@/lib/models";
import { handle, ok, isId, HttpError } from "@/lib/http";
import { validateSlot } from "@/lib/routine";
import { audit } from "@/lib/audit";
import { safeSync } from "@/lib/routine-sync";

async function load(id) { if (!isId(id)) throw new HttpError(404, "পাওয়া যায়নি"); await connectDB(); const r = await RoutineSlot.findById(id); if (!r) throw new HttpError(404, "পাওয়া যায়নি"); return r; }
export const PUT = handle(async (req, { params }) => {
  const user = await requireUser("routine.manage");
  const r = await load((await params).id);
  const d = await validateSlot(await req.json(), r);
  const before = { class: r.class, section: r.section, subject: r.subject, day: r.day, time: `${r.startTime}-${r.endTime}` };
  const old = { class: r.class, section: r.section || "" };
  r.set(d); await r.save();
  await safeSync(d.class, d.section); if (old.class !== d.class || old.section !== (d.section || "")) await safeSync(old.class, old.section);
  await audit(user, "update", "routine", r._id, { before, after: { class: d.class, section: d.section, subject: d.subject, day: d.day, time: `${d.startTime}-${d.endTime}` } });
  return ok();
});
export const DELETE = handle(async (_r, { params }) => {
  const user = await requireUser("routine.manage");
  const r = await load((await params).id);
  await r.deleteOne();
  await safeSync(r.class, r.section);
  await audit(user, "delete", "routine", r._id, { class: r.class, section: r.section, subject: r.subject, day: r.day, time: `${r.startTime}-${r.endTime}` });
  return ok();
});
