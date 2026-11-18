import { connectDB } from "@/lib/db";
import { ExamNotice } from "@/lib/models";
import { handle, cachedJson } from "@/lib/http";

// লগইন ছাড়া — হোমপেজের জন্য। শুধু প্রকাশিত নোটিশ, কোনো ব্যক্তিগত তথ্য নেই
export const GET = handle(async (req) => {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = { status: "published", archived: { $ne: true } };
  if (sp.get("class")) { f.class = String(sp.get("class")).slice(0, 30); if (sp.get("section")) f.section = { $in: ["", String(sp.get("section")).slice(0, 30)] }; }
  const items = await ExamNotice.find(f).sort({ createdAt: -1 }).limit(40).select("-createdByName -batch").lean();
  return cachedJson({ items }, 30);
});
