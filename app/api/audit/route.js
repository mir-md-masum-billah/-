import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { AuditLog } from "@/lib/models";
import { handle, json, esc } from "@/lib/http";
import { isDate } from "@/lib/dates";

// ফিল্টার: entity (একাধিক কমা দিয়ে — ক্যাটাগরি), action, user (নাম), from/to (বাংলাদেশ সময়ের তারিখ), q
export const GET = handle(async (req) => {
  await requireUser("audit.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  const ents = (sp.get("entity") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (ents.length) f.entity = { $in: ents };
  const acts = (sp.get("action") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  if (acts.length) f.action = { $in: acts };
  if (sp.get("user")) f.userName = String(sp.get("user")).slice(0, 80);
  const from = sp.get("from"), to = sp.get("to");
  if (isDate(from) || isDate(to)) f.createdAt = { ...(isDate(from) && { $gte: new Date(`${from}T00:00:00+06:00`) }), ...(isDate(to) && { $lte: new Date(`${to}T23:59:59.999+06:00`) }) };
  const q = (sp.get("q") || "").trim().slice(0, 40);
  if (q) f.$or = [{ userName: { $regex: esc(q), $options: "i" } }, { action: { $regex: esc(q), $options: "i" } }, { entity: { $regex: esc(q), $options: "i" } }, { "details.name": { $regex: esc(q), $options: "i" } }, { "details.receiptNo": { $regex: esc(q), $options: "i" } }, { "details.invoiceNo": { $regex: esc(q), $options: "i" } }];
  const limit = Math.min(parseInt(sp.get("limit")) || 30, 200), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items, users] = await Promise.all([AuditLog.countDocuments(f), AuditLog.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), page === 1 ? AuditLog.distinct("userName") : []]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), users: users.filter(Boolean).sort() });
});
