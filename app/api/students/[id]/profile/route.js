import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory, Invoice, Payment } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { visibleScopes, inScope } from "@/lib/assign";
import { netPaidMap, obligation, round2 } from "@/lib/finance";

export const GET = handle(async (_req, { params }) => {
  const user = await requireUser("students.read");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const s = await Student.findById(id).populate("optionalSubjects", "name code").lean();
  if (!s) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  if (!inScope(await visibleScopes(user), s.class, s.section)) throw new HttpError(403, "এই শিক্ষার্থীর তথ্য দেখার অনুমতি নেই");
  delete s.password;
  const out = { student: s, history: await StudentHistory.find({ student: id }).sort({ createdAt: -1 }).lean() };
  if (user.perms.includes("fees.read")) {
    const inv = await Invoice.find({ student: id, status: "open" }).lean();
    const map = await netPaidMap(inv.map((i) => i._id));
    out.payments = await Payment.find({ student: id, voided: { $ne: true } }).sort({ date: -1 }).populate("invoice", "title period invoiceNo").lean();
    out.due = round2(inv.reduce((t, i) => t + Math.max(0, obligation(i) - (map[String(i._id)] || 0)), 0));
  }
  return json(out);
});
