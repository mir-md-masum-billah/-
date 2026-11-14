import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { audit } from "@/lib/audit";

async function load(params) {
  const user = await requireUser("students.write");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const s = await Student.findById(id);
  if (!s || s.archived) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  return { user, s };
}
// ভর্তির কাগজপত্র: ফাইল আগে /api/upload দিয়ে R2 তে যায়; এখানে শুধু আমাদের R2 লিংক গ্রহণযোগ্য
export const POST = handle(async (req, { params }) => {
  const { user, s } = await load(params);
  const { name, url } = await req.json();
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new HttpError(503, "ফাইল স্টোরেজ (R2) কনফিগার করা নেই");
  if (typeof url !== "string" || !url.startsWith(base + "/")) throw bad("শুধু আপলোড করা ফাইলের লিংক গ্রহণযোগ্য");
  if (typeof name !== "string" || name.trim().length < 2) throw bad("কাগজের নাম দিন");
  if (s.documents.length >= 20) throw bad("সর্বোচ্চ ২০টি কাগজ");
  s.documents.push({ name: name.trim().slice(0, 100), url }); await s.save();
  await audit(user, "add_document", "students", s._id, { name });
  return ok();
});
export const DELETE = handle(async (req, { params }) => {
  const { user, s } = await load(params);
  const doc = new URL(req.url).searchParams.get("doc");
  const d = s.documents.id(doc);
  if (!d) throw new HttpError(404, "কাগজ পাওয়া যায়নি");
  const name = d.name; d.deleteOne(); await s.save();
  await audit(user, "remove_document", "students", s._id, { name });
  return ok();
});
