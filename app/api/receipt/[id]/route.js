import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice, Payment, Student } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { netPaidMap, obligation, round2 } from "@/lib/finance";
import { getSettings } from "@/lib/settings";

export const GET = handle(async (_req, { params }) => {
  const { id } = await params;
  const u = await requireUser();
  if (!isId(id)) throw new HttpError(404, "রসিদ পাওয়া যায়নি");
  await connectDB();
  const p = await Payment.findById(id).lean();
  if (!p) throw new HttpError(404, "রসিদ পাওয়া যায়নি");
  if (u.role === "student") { if (String(p.student) !== u.id) throw new HttpError(403, "অনুমতি নেই"); }
  else if (!u.perms.includes("fees.read")) throw new HttpError(403, "অনুমতি নেই");
  const [inv, stu, st] = await Promise.all([Invoice.findById(p.invoice).lean(), Student.findById(p.student).select("name studentId class section roll fatherName").lean(), getSettings()]);
  const net = (await netPaidMap([p.invoice]))[String(p.invoice)] || 0;
  return json({ payment: p, invoice: inv, student: stu, balance: { obligation: obligation(inv), paid: net, due: round2(obligation(inv) - net) }, school: { name: st.schoolName, address: st.address, phone: st.phone, logo: st.logo } });
});
