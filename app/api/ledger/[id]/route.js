import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { LedgerEntry } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { audit } from "@/lib/audit";

// শুধু ম্যানুয়াল এন্ট্রি বাতিল করা যায় (কারণ সহ)। পেমেন্টের এন্ট্রি পেমেন্ট বাতিল করলে বাতিল হয়
export const DELETE = handle(async (req, { params }) => {
  const user = await requireUser("accounts.write");
  const { id } = await params;
  const { reason } = await req.json().catch(() => ({}));
  if (!reason || String(reason).trim().length < 3) throw bad("বাতিলের কারণ লিখুন");
  if (!isId(id)) throw new HttpError(404, "এন্ট্রি পাওয়া যায়নি");
  await connectDB();
  const e = await LedgerEntry.findById(id);
  if (!e) throw new HttpError(404, "এন্ট্রি পাওয়া যায়নি");
  if (e.source !== "manual") throw bad("এটি পেমেন্ট থেকে তৈরি — পেমেন্ট পেজ থেকে বাতিল করুন");
  if (e.voided) throw new HttpError(409, "আগেই বাতিল হয়েছে");
  e.set({ voided: true, voidReason: String(reason).trim().slice(0, 200), voidedAt: new Date() });
  e.dedupeKey = undefined; // বাতিলের পর একই এন্ট্রি সঠিকভাবে আবার তোলা যাবে
  await e.save();
  await audit(user, "void", "ledger", e._id, { title: e.title, amount: e.amount, reason: e.voidReason });
  return ok();
});
