import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { AdmitCard, ExamNotice, Student } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { admitEligible } from "@/lib/pay";
import { getSettings } from "@/lib/settings";
import { visibleScopes, inScope } from "@/lib/assign";

// অ্যাডমিট কার্ডের তথ্য: শিক্ষার্থী শুধু নিজের; স্টাফ শুধু exams.manage সহ। ফি অনুমোদিত না হলে কারও জন্যই নয়
export const GET = handle(async (_r, { params }) => {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "অ্যাডমিট কার্ড পাওয়া যায়নি");
  await connectDB();
  const c = await AdmitCard.findById(id).lean();
  if (!c) throw new HttpError(404, "অ্যাডমিট কার্ড পাওয়া যায়নি");
  if (u.role === "student") { if (String(c.student) !== u.id) throw new HttpError(403, "অনুমতি নেই"); }
  else {
    if (!u.perms.includes("exams.manage")) throw new HttpError(403, "অনুমতি নেই");
    if (!inScope(await visibleScopes(u), c.class, c.section)) throw new HttpError(403, "অনুমতি নেই");
  }
  const exam = await ExamNotice.findById(c.exam).lean();
  if (!(await admitEligible(c, exam))) throw new HttpError(403, "পরীক্ষার ফি অনুমোদিত না হওয়া পর্যন্ত অ্যাডমিট কার্ড পাওয়া যাবে না");
  const [stu, st] = await Promise.all([Student.findById(c.student).select("name studentId photo class section roll fatherName dob").lean(), getSettings()]);
  return json({ card: c, exam, student: stu, school: { name: st.schoolName, nameEn: st.schoolNameEn, tagline: st.tagline, taglineEn: st.taglineEn, address: st.address, phone: st.phone, logo: st.logo } });
});
