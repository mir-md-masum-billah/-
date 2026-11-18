import { Student, Result, ResultPublication, ExamNotice } from "@/lib/models";

// ফলাফল "চূড়ান্তভাবে প্রকাশিত" কি? — প্রকাশের রেকর্ড (পুরো শ্রেণি বা ওই শাখা) থাকলে, অথবা পুরনো ডেটায় সব নম্বরই প্রকাশিত থাকলে।
// একবার চূড়ান্ত হলে নতুন করে প্রকাশ বা প্রত্যাহার করা যায় না; শুধু নম্বর সংশোধন চলে (সংশোধন সাথে সাথে শিক্ষার্থী দেখে)।
export async function isFinal(exam, year, cls, section = "") {
  if (await ResultPublication.exists({ exam, year, class: cls, section: { $in: ["", section || ""] } })) return true;
  const ids = await Student.find({ class: cls, ...(section ? { section } : {}) }).distinct("_id");
  if (!ids.length) return false;
  const base = { exam, year, student: { $in: ids } };
  const [pub, unpub] = await Promise.all([Result.countDocuments({ ...base, published: { $ne: false } }), Result.countDocuments({ ...base, published: false })]);
  return pub > 0 && unpub === 0;
}

// এই শ্রেণির জন্য পরীক্ষাটি বৈধ কি? নোটিশ আছে, অথবা আগে এই নামে নম্বর দেওয়া আছে (পুরনো ডেটা)
export async function examAllowed(exam, cls, year) {
  if (await ExamNotice.exists({ name: exam, class: cls, status: "published" })) return true;
  const ids = await Student.find({ class: cls }).distinct("_id");
  return !!(await Result.exists({ exam, year, student: { $in: ids } }));
}
