import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { resources, pick } from "@/lib/resources";
import { handle, ok, HttpError, bad, isId } from "@/lib/http";
import { audit } from "@/lib/audit";

async function load(params) {
  const { resource, id } = await params;
  const c = resources[resource];
  if (!c) throw new HttpError(404, "পাওয়া যায়নি");
  const user = await requireUser(c.write);
  if (!isId(id)) throw new HttpError(404, "রেকর্ড পাওয়া যায়নি");
  await connectDB();
  const existing = await c.model.findById(id).select(c.hash ? "+password" : "");
  if (!existing) throw new HttpError(404, "রেকর্ড পাওয়া যায়নি"); // আগে "সফল" দেখাত — এখন ঠিকমতো 404
  return { c, resource, user, existing };
}
const snapshot = (doc) => { const o = doc.toObject(); delete o.password; delete o.history; return o; };

export const PUT = handle(async (req, { params }) => {
  const { c, resource, user, existing } = await load(params);
  const data = pick(await req.json(), c.allow);
  if (c.archive && existing.archived) throw bad("আর্কাইভ করা রেকর্ড এডিট করা যায় না");
  await c.validate?.(data, { isUpdate: true, existing, user });
  if (c.hash) {
    if (data.password) {
      if (String(data.password).length < 6) throw bad("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন");
      data.password = await bcrypt.hash(String(data.password), 10);
    } else delete data.password; // ফাঁকা = পুরনো পাসওয়ার্ড থাকবে
  }
  const before = snapshot(existing);
  const beforeDoc = existing.toObject();
  if (c.history) existing.history.push({ marks: existing.marks, full: existing.full, by: user.name });
  existing.set(data);
  await existing.save();
  await c.afterUpdate?.(beforeDoc, existing, { user });
  await audit(user, "update", resource, existing._id, { before, changed: Object.keys(data).filter((k) => k !== "password") });
  return ok();
});

export const DELETE = handle(async (_req, { params }) => {
  const { c, resource, user, existing } = await load(params);
  const before = snapshot(existing);
  if (c.archive) { // শিক্ষার্থী: আর্কাইভ (ইতিহাস ও আর্থিক রেকর্ড থেকে যায়)
    existing.set({ archived: true, active: false, archivedAt: new Date() }); await existing.save();
    await audit(user, "archive", resource, existing._id, { before });
  } else if (c.softDelete) { // স্টাফ: নিষ্ক্রিয়
    if (String(existing._id) === user.id) throw bad("নিজেকে নিষ্ক্রিয় করা যাবে না");
    await c.validate?.({}, { isUpdate: true, existing, user });
    existing.set({ active: false }); await existing.save();
    await audit(user, "deactivate", resource, existing._id, { before });
  } else {
    await c.checkDelete?.(existing, { user });
    await existing.deleteOne();
    await audit(user, "delete", resource, existing._id, { before });
  }
  return ok();
});
