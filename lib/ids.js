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

// ফর্মে আগে থেকে দেখানোর জন্য (কাউন্টার না বাড়িয়ে) পরের শিক্ষার্থী আইডি
export async function peekStudentId() {
  const c = await Counter.findById(`STU-${yearDhaka()}`).lean();
  for (let seq = (c?.seq || 0) + 1; seq < (c?.seq || 0) + 500; seq++) {
    const id = `${yearDhaka()}${String(seq).padStart(4, "0")}`;
    if (!(await Student.exists({ studentId: id }))) return id;
  }
  return "";
}
// শিক্ষক/স্টাফ আইডি: সর্বশেষ আইডির শেষের সংখ্যার সাথে ১ যোগ (অক্ষর/শূন্য-ভরাট একই থাকে)। কিছু না থাকলে T0001
export async function peekStaffId() {
  const { User } = await import("@/lib/models");
  const last = await User.findOne().sort({ createdAt: -1 }).select("userId").lean();
  let prefix = "T", width = 4, n = 0;
  const m = last && /^(.*?)(\d+)$/.exec(last.userId);
  if (m) { prefix = m[1]; width = m[2].length; n = Number(m[2]); }
  for (let i = 1; i < 500; i++) {
    const id = `${prefix}${String(n + i).padStart(width, "0")}`;
    if (!(await User.exists({ userId: id }))) return id;
  }
  return "";
}
