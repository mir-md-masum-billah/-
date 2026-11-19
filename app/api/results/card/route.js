import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { handle, json, HttpError } from "@/lib/http";
import { cardStudent, buildCard } from "@/lib/resultCard";

// রেজাল্ট কার্ডের তথ্য (একটি পরীক্ষা)। শিক্ষার্থী শুধু নিজের ও শুধু প্রকাশিত ফল পায়; স্টাফের results.read ও শ্রেণির অনুমতি লাগে।
export const GET = handle(async (req) => {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  const sp = new URL(req.url).searchParams, exam = sp.get("exam") || "", year = Number(sp.get("year"));
  if (!exam || !Number.isFinite(year)) throw new HttpError(400, "তথ্য সঠিক নয়");
  await connectDB();
  const s = await cardStudent(u, sp.get("student"));
  const card = await buildCard(u, s, exam, year);
  if (!card) throw new HttpError(404, "ফলাফল পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি");
  return json(card);
});
