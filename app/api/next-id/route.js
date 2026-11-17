import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { handle, json } from "@/lib/http";
import { peekStudentId, peekStaffId } from "@/lib/ids";

// নতুন ভর্তি/স্টাফ ফর্মে স্বয়ংক্রিয় আইডি (সর্বশেষ আইডি + ১) আগে থেকে লিখে দেখানোর জন্য
export const GET = handle(async (req) => {
  const kind = new URL(req.url).searchParams.get("kind");
  await connectDB();
  if (kind === "staff") { await requireUser("staff.write"); return json({ id: await peekStaffId() }); }
  await requireUser("students.write");
  return json({ id: await peekStudentId() });
});
