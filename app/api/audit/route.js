import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { AuditLog } from "@/lib/models";
import { handle, json, esc } from "@/lib/http";

export const GET = handle(async (req) => {
  await requireUser("audit.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  if (sp.get("entity")) f.entity = sp.get("entity");
  const q = (sp.get("q") || "").trim().slice(0, 40);
  if (q) f.$or = [{ userName: { $regex: esc(q), $options: "i" } }, { action: { $regex: esc(q), $options: "i" } }];
  const limit = Math.min(parseInt(sp.get("limit")) || 30, 200), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([AuditLog.countDocuments(f), AuditLog.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});
