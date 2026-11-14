import { requireUser } from "@/lib/guard";
import { handle, json, HttpError } from "@/lib/http";
import { uploadToR2 } from "@/lib/r2";

// ফাইলের আসল ধরন ম্যাজিক বাইট দেখে যাচাই (ক্লায়েন্টের দেওয়া type/নাম বিশ্বাস করা হয় না)
function detect(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ["image/jpeg", "jpg"];
  if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ["image/png", "png"];
  if (b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") return ["image/webp", "webp"];
  if (b.slice(0, 4).toString() === "%PDF") return ["application/pdf", "pdf"];
  return null;
}
export const POST = handle(async (req) => {
  const u = await requireUser();
  if (u.role === "student" || u.role === "parent") throw new HttpError(403, "অনুমতি নেই");
  const file = (await req.formData()).get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "ফাইল দিন");
  if (file.size > 5 * 1024 * 1024) throw new HttpError(400, "ফাইল ৫MB এর বেশি");
  const buf = Buffer.from(await file.arrayBuffer());
  const t = detect(buf);
  if (!t) throw new HttpError(400, "শুধু JPG, PNG, WEBP বা PDF ফাইল দিন");
  if (!process.env.R2_BUCKET || !process.env.R2_ACCOUNT_ID) throw new HttpError(503, "ফাইল স্টোরেজ (R2) কনফিগার করা নেই");
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${t[1]}`;
  try { return json({ url: await uploadToR2(buf, key, t[0]) }); }
  catch (e) { console.error("R2 upload failed", e); throw new HttpError(502, "আপলোড ব্যর্থ হয়েছে, আবার চেষ্টা করুন"); }
});
