import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { currentUser, requireUser } from "@/lib/guard";
import { resources, pick } from "@/lib/resources";
import { handle, json, ok, HttpError, bad, esc } from "@/lib/http";
import { audit } from "@/lib/audit";

const cfgOf = async (params) => { const { resource } = await params; const c = resources[resource]; if (!c) throw new HttpError(404, "পাওয়া যায়নি"); return { c, resource }; };

export const GET = handle(async (req, { params }) => {
  const { c } = await cfgOf(params);
  const user = c.read !== "public" ? await requireUser(c.read) : null;
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const filter = {};
  (c.filters || []).forEach((k) => { const v = sp.get(k); if (v !== null && v !== "") filter[k] = v === "true" ? true : v === "false" ? false : (k === "role" && v.includes(",")) ? { $in: v.split(",").slice(0, 8) } : v; });
  if (c.archive && sp.get("archived") !== "true") filter.archived = { $ne: true };
  const q = (sp.get("q") || "").trim().slice(0, 60);
  const and = [];
  if (q && c.search?.length) and.push({ $or: c.search.map((f) => ({ [f]: { $regex: esc(q), $options: "i" } })) });
  if (c.scope && user) { const sc = await c.scope(user); if (Object.keys(sc).length) and.push(sc); } // শিক্ষক শুধু নিজের নিয়োগকৃত শ্রেণি দেখে
  if (and.length) filter.$and = and;
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 20, 1), 1000);
  const page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([
    c.model.countDocuments(filter),
    (() => { let x = c.model.find(filter).sort(c.sort).skip((page - 1) * limit).limit(limit); if (c.populate) for (const pp of c.populate) x = x.populate(pp); return x.lean(); })(),
  ]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const POST = handle(async (req, { params }) => {
  const { c, resource } = await cfgOf(params);
  const user = await requireUser(c.write);
  await connectDB();
  const data = pick(await req.json(), c.allow);
  const extra = (await c.before?.(data, { user })) || {};
  await c.validate?.(data, { isUpdate: false, user });
  if (c.hash) {
    if (!data.password || String(data.password).length < 6) throw bad("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন");
    data.password = await bcrypt.hash(String(data.password), 10);
  }
  const doc = await c.model.create(data);
  await c.afterCreate?.(doc, { user });
  await audit(user, "create", resource, doc._id, { name: data.name || data.title || data.userId });
  return ok({ id: doc._id, ...extra });
});
