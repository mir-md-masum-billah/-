import crypto from "crypto";
import { Counter, Student } from "@/lib/models";
import { yearDhaka } from "@/lib/dates";

// শিক্ষার্থী আইডি: বছর + ৪ অঙ্কের ক্রম (যেমন 20260001) — স্বয়ংক্রিয়, ডুপ্লিকেট হলে এড়িয়ে যায়
export async function nextStudentId(session = null) {
  for (let i = 0; i < 20; i++) {
    const c = await Counter.findOneAndUpdate({ _id: `STU-${yearDhaka()}` }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });
    const id = `${yearDhaka()}${String(c.seq).padStart(4, "0")}`;
    if (!(await Student.exists({ studentId: id }).session(session))) return id;
  }
  throw new Error("আইডি তৈরি করা যায়নি");
}
const ALPHA = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // বিভ্রান্তিকর অক্ষর (0/O/1/l/I) বাদ
export const genPassword = (n = 8) => Array.from(crypto.randomBytes(n), (b) => ALPHA[b % ALPHA.length]).join("");
export async function nextRoll(cls, section, session) {
  const q = { class: cls, archived: { $ne: true }, active: true };
  q.section = section ? section : { $in: [null, ""] };
  q.session = session ? session : { $in: [null, ""] };
  const top = await Student.findOne(q).sort({ roll: -1 }).select("roll").lean();
  return (top?.roll || 0) + 1;
}
