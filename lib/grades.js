// বাংলাদেশের প্রচলিত গ্রেডিং: শতকরা নম্বর → লেটার গ্রেড ও জিপিএ পয়েন্ট
export function gradeOf(marks, full) {
  const p = full > 0 ? (marks / full) * 100 : 0;
  if (p >= 80) return { g: "A+", gp: 5 }; if (p >= 70) return { g: "A", gp: 4 }; if (p >= 60) return { g: "A-", gp: 3.5 };
  if (p >= 50) return { g: "B", gp: 3 }; if (p >= 40) return { g: "C", gp: 2 }; if (p >= 33) return { g: "D", gp: 1 };
  return { g: "F", gp: 0 };
}
// একটি পরীক্ষার সব বিষয় → মোট, শতকরা, জিপিএ, ফল। কোনো বিষয়ে F হলে অকৃতকার্য (জিপিএ ০.০০)
export function summarize(rows) {
  const subs = rows.map((r) => ({ ...r, ...gradeOf(r.marks, r.full) }));
  const total = subs.reduce((t, r) => t + r.marks, 0), full = subs.reduce((t, r) => t + r.full, 0);
  const failed = subs.some((r) => r.g === "F");
  const gpa = !subs.length || failed ? 0 : subs.reduce((t, r) => t + r.gp, 0) / subs.length;
  const letter = failed ? "F" : gpa >= 5 ? "A+" : gpa >= 4 ? "A" : gpa >= 3.5 ? "A-" : gpa >= 3 ? "B" : gpa >= 2 ? "C" : "D";
  return { subs, total, full, percent: full ? (total / full) * 100 : 0, gpa, letter, passed: !failed && subs.length > 0 };
}
