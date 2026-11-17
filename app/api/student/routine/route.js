import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { RoutineSlot, Student } from "@/lib/models";
import { handle, json } from "@/lib/http";

// শিক্ষার্থী শুধু নিজের শ্রেণি ও শাখার রুটিন পায় (শ্রেণি সেশন থেকে, ক্লায়েন্ট থেকে নয়)
export const GET = handle(async () => {
  const u = await requireStudent();
  await connectDB();
  const s = await Student.findById(u.id).select("class section").lean();
  const items = await RoutineSlot.find({ class: s.class, section: { $in: ["", s.section || ""] } }).sort({ day: 1, startTime: 1 }).populate("teacher", "name").lean();
  return json({ class: s.class, section: s.section || "", items: items.map((i) => ({ _id: i._id, day: i.day, startTime: i.startTime, endTime: i.endTime, subject: i.subject, teacher: i.teacher?.name })) });
});
