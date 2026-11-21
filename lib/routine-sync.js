import { RoutineSlot, Assignment, Subject } from "@/lib/models";

// ক্লাস রুটিন থেকে শিক্ষক নিয়োগ (স্বয়ংক্রিয়):
//   রুটিনে যে শ্রেণি/শাখার প্রথম ক্লাস (সবচেয়ে আগের সময়, প্রতিদিনের প্রথম পিরিয়ড) যে স্যারকে দেওয়া হয় — তিনিই ক্লাস টিচার;
//   বাকি সবাই বিষয় শিক্ষক (নিজের বিষয়ের)। ক্লাস টিচার সব বিষয়ের, বিষয় শিক্ষক শুধু নিজের বিষয়ের নম্বর দিতে পারেন।
//   হাতে দেওয়া নিয়োগ (auto = false) অপরিবর্তিত থাকে; শুধু স্বয়ংক্রিয়গুলো রুটিনের সাথে মিলিয়ে হালনাগাদ হয়।
export async function syncAssignments(cls, section = "") {
  const slots = await RoutineSlot.find({ class: cls, section }).lean();
  const subs = await Subject.find({}).select("name classes").lean();
  const want = []; // { kind, teacher, subject? }
  if (slots.length) {
    const firstOfDay = new Map(); // দিন → সবচেয়ে আগের ক্লাস
    for (const s of slots) { const c = firstOfDay.get(s.day); if (!c || s.startTime < c.startTime) firstOfDay.set(s.day, s); }
    const earliest = [...firstOfDay.values()].map((s) => s.startTime).sort()[0];
    const count = new Map(); for (const s of firstOfDay.values()) { const k = String(s.teacher); count.set(k, (count.get(k) || 0) + (s.startTime === earliest ? 2 : 1)); }
    const ct = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (ct) want.push({ kind: "class", teacher: ct });
    const seen = new Set();
    for (const s of slots) {
      const sub = subs.find((x) => x.name === s.subject && (!x.classes?.length || x.classes.includes(cls)));
      if (!sub) continue; const k = `${s.teacher}|${sub._id}`; if (seen.has(k)) continue; seen.add(k);
      want.push({ kind: "subject", teacher: String(s.teacher), subject: String(sub._id) });
    }
  }
  const have = await Assignment.find({ class: cls, section, auto: true }).lean();
  const key = (a) => (a.kind === "class" ? "class" : `s|${a.teacher}|${a.subject}`);
  const wk = new Set(want.map(key));
  // বাদ পড়া স্বয়ংক্রিয় নিয়োগ সরানো
  for (const a of have) if (!wk.has(key({ kind: a.kind, teacher: String(a.teacher), subject: a.subject && String(a.subject) }))) await Assignment.deleteOne({ _id: a._id });
  for (const w of want) {
    if (w.kind === "class") {
      // এই শ্রেণি/শাখার আগের স্বয়ংক্রিয় ক্লাস টিচার বদলে নতুন; হাতে দেওয়া ক্লাস টিচার থাকলে সেটাই থাকে
      if (await Assignment.exists({ kind: "class", class: cls, section, auto: { $ne: true } })) { await Assignment.deleteMany({ kind: "class", class: cls, section, auto: true }); continue; }
      await Assignment.deleteMany({ kind: "class", class: cls, section, auto: true, teacher: { $ne: w.teacher } });
      await Assignment.updateOne({ kind: "class", class: cls, section, teacher: w.teacher }, { $setOnInsert: { auto: true } }, { upsert: true });
    } else {
      await Assignment.updateOne({ kind: "subject", class: cls, section, teacher: w.teacher, subject: w.subject }, { $setOnInsert: { auto: true } }, { upsert: true });
    }
  }
}
export async function syncAll() {
  const pairs = await RoutineSlot.aggregate([{ $group: { _id: { c: "$class", s: "$section" } } }]);
  const olds = await Assignment.aggregate([{ $match: { auto: true } }, { $group: { _id: { c: "$class", s: "$section" } } }]);
  const set = new Map(); for (const p of [...pairs, ...olds]) set.set(`${p._id.c}|${p._id.s || ""}`, { c: p._id.c, s: p._id.s || "" });
  for (const { c, s } of set.values()) await syncAssignments(c, s);
  return set.size;
}
export const safeSync = async (cls, section) => { try { await syncAssignments(cls, section || ""); } catch (e) { console.error("routine sync", e); } };
