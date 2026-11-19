// প্রিন্ট ডায়ালগে "Save as PDF" এর ডিফল্ট ফাইলের নাম আসে পেজের title থেকে — তাই প্রতিটি নথির নাম আলাদা ও অর্থবহ করা হয়েছে।
// ফরম্যাট: স্কুলের নাম - শিক্ষার্থীর নাম - শ্রেণি - রোল - আইডি - নথির ধরন (ভাষা অনুযায়ী বাংলা/English)
export const cleanName = (s) => String(s ?? "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
export const docName = (parts) => cleanName(parts.filter(Boolean).join(" - ")).slice(0, 160);

// শিক্ষার্থী অংশ: "মাসুম বিল্লাহ - শ্রেণি ১ম - রোল ১ - আইডি 2938382"
export function studentTag(s, { x, n, lang }) {
  if (!s) return "";
  const en = lang === "en";
  return [s.name, s.class && `${en ? "Class" : "শ্রেণি"} ${x(s.class)}${s.section ? ` (${s.section})` : ""}`, s.roll != null && `${en ? "Roll" : "রোল"} ${n(s.roll)}`, s.studentId && `${en ? "ID" : "আইডি"} ${s.studentId}`].filter(Boolean).join(" - ");
}
