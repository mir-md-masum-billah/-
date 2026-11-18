import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { ExamNotice, Student, Invoice, AdmitCard, PaymentSubmission } from "@/lib/models";
import { handle, json } from "@/lib/http";
import { netPaidMap, withBalance } from "@/lib/finance";
import { admitEligible } from "@/lib/pay";

// নিজের শ্রেণি/শাখার প্রকাশিত নোটিশ + নিজের ফি ও অ্যাডমিট কার্ডের অবস্থা
export const GET = handle(async () => {
  const u = await requireStudent();
  await connectDB();
  const s = await Student.findById(u.id).select("class section").lean();
  const exams = await ExamNotice.find({ status: "published", archived: { $ne: true }, class: s.class, section: { $in: ["", s.section || ""] } }).sort({ createdAt: -1 }).limit(30).select("-createdByName -batch").lean();
  const invs = await Invoice.find({ student: u.id, examNotice: { $in: exams.map((e) => e._id) }, status: "open" }).lean();
  const map = await netPaidMap(invs.map((i) => i._id));
  const pend = await PaymentSubmission.find({ student: u.id, invoice: { $in: invs.map((i) => i._id) }, status: "pending" }).select("invoice amount").lean();
  const cards = await AdmitCard.find({ student: u.id, exam: { $in: exams.map((e) => e._id) } }).lean();
  const items = [];
  for (const e of exams) {
    const inv = invs.find((i) => String(i.examNotice) === String(e._id));
    const card = cards.find((c) => String(c.exam) === String(e._id));
    items.push({ ...e, invoice: inv ? withBalance(inv, map[String(inv._id)] || 0) : null, pending: pend.some((p) => String(p.invoice) === String(inv?._id)), admit: card ? { id: card._id, admitNo: card.admitNo, eligible: await admitEligible(card, e) } : null });
  }
  return json({ items });
});
