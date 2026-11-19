import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { handle, json, bad } from "@/lib/http";
import { meritList } from "@/lib/merit";

// মেধা তালিকা: একটি পরীক্ষায় শ্রেণির (শাখার) সবার মেধাক্রম, মোট নম্বর, জিপিএ ও গ্রেড — ১ম, ২য়, ৩য়... ক্রমে
export const GET = handle(async (req) => {
  const user = await requireUser("results.read");
  const sp = new URL(req.url).searchParams, exam = sp.get("exam") || "", year = Number(sp.get("year"));
  if (!exam || !Number.isFinite(year)) throw bad("পরীক্ষা ও বছর দিন");
  await connectDB();
  return json(await meritList(user, { cls: sp.get("class") || "", section: sp.get("section") || "", exam, year }));
});
