import crypto from "crypto";
import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { ExamNotice } from "@/lib/models";
import { handle, json, ok, HttpError, esc } from "@/lib/http";
import { validateExam, generateForExam } from "@/lib/exams";
import { visibleScopes, inScope } from "@/lib/assign";
import { audit } from "@/lib/audit";

export const GET = handle(async (req) => {
  const u = await requireUser("exams.manage");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = sp.get("archived") === "1" ? { archived: true } : { archived: { $ne: true } };
  if (sp.get("class")) f.class = sp.get("class");
  const q = (sp.get("q") || "").trim().slice(0, 40);
  if (q) f.name = { $regex: esc(q), $options: "i" };
  const sc = await visibleScopes(u);
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 20, 1), 200), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  let items = await ExamNotice.find(f).sort({ createdAt: -1 }).lean();
  items = items.filter((e) => inScope(sc, e.class, e.section));
  const total = items.length;
  return json({ items: items.slice((page - 1) * limit, page * limit), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// একাধিক শ্রেণি/শাখা বাছাই করলে প্রতিটির জন্য আলাদা নোটিশ তৈরি হয় (একই ব্যাচে)
export const POST = handle(async (req) => {
  const user = await requireUser("exams.manage");
  const d = await validateExam(await req.json());
  const sc = await visibleScopes(user);
  for (const t of d.targets) if (!inScope(sc, t.class, t.section)) throw new HttpError(403, `${t.class} শ্রেণির নোটিশ দেওয়ার অনুমতি নেই`);
  const batch = crypto.randomBytes(5).toString("hex");
  const created = await withTx(async (session) => {
    const out = [];
    for (const t of d.targets) {
      const [e] = await ExamNotice.create([{ name: d.name, class: t.class, section: t.section, session: d.session, schedule: d.schedule, fee: d.fee, instructions: d.instructions, createdByName: user.name, batch }], { session });
      const gen = await generateForExam(e, session);
      await audit(user, "create", "exam_notice", e._id, { name: d.name, class: t.class, section: t.section, fee: d.fee, ...gen }, session);
      out.push({ id: e._id, class: t.class, section: t.section, ...gen });
    }
    return out;
  });
  return ok({ created });
});
