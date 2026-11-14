import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student } from "@/lib/models";
import { handle } from "@/lib/http";
import { visibleScopes, scopeFilter } from "@/lib/assign";

export const COLS = ["studentId", "name", "class", "section", "roll", "session", "gender", "fatherName", "motherName", "guardianName", "guardianPhone", "phone", "address", "birthRegNo", "dob", "admissionDate", "monthlyFee", "previousSchool", "previousClass", "status"];
// স্প্রেডশিট ফর্মুলা ইনজেকশন ঠেকাতে = + - @ দিয়ে শুরু হলে আগে ' বসে
const cell = (v) => { let s = v === undefined || v === null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export const GET = handle(async (req) => {
  const user = await requireUser("students.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const q = { archived: { $ne: true } };
  for (const k of ["class", "section", "session", "status"]) if (sp.get(k)) q[k] = sp.get(k);
  const sc = scopeFilter(await visibleScopes(user));
  const list = await Student.find(Object.keys(sc).length ? { $and: [q, sc] } : q).sort({ class: 1, section: 1, roll: 1 }).limit(5000).lean();
  const csv = "\uFEFF" + [COLS.join(","), ...list.map((s) => COLS.map((c) => cell(s[c])).join(","))].join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="students.csv"' } });
});
