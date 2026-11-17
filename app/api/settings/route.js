import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Settings, Student, PAY_METHODS } from "@/lib/models";
import crypto from "crypto";
import { handle, json, ok, bad, num } from "@/lib/http";
import { getSettings, bustSettings } from "@/lib/settings";
import { PERMISSIONS, DEFAULT_PERMS, ROLES, resolvePerms } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export const GET = handle(async () => {
  const u = await requireUser();
  const s = await getSettings();
  const out = { schoolName: s.schoolName, schoolNameEn: s.schoolNameEn, taglineEn: s.taglineEn, logo: s.logo, address: s.address, phone: s.phone, email: s.email, about: s.about, tagline: s.tagline, currentSession: s.currentSession, classes: s.classes };
  if (u.perms.includes("settings.manage")) Object.assign(out, { paymentMethods: s.paymentMethods || [], openingBalances: s.openingBalances, rolePermissions: Object.fromEntries(ROLES.filter((r) => !["student", "parent", "superadmin"].includes(r)).map((r) => [r, resolvePerms(r, s.rolePermissions, s.permsKnown)])), permissionList: PERMISSIONS, restrictTeachers: s.restrictTeachers !== false });
  return json(out);
});

export const PUT = handle(async (req) => {
  const user = await requireUser("settings.manage");
  await connectDB();
  const b = await req.json();
  const upd = {};
  for (const k of ["schoolName", "schoolNameEn", "taglineEn", "address", "phone", "email", "about", "tagline", "currentSession"]) if (b[k] !== undefined) upd[k] = String(b[k]).trim().slice(0, 500);
  if (b.logo !== undefined) { // খালি (সরানো), http(s)/সাইটের ঠিকানা, অথবা ব্রাউজারে ছোট করা ছবি (data URL)
    const v = String(b.logo).trim();
    if (v && !/^(https?:\/\/|\/)\S{1,500}$/.test(v) && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) throw bad("লোগো সঠিক ছবি নয়");
    if (v.length > 150000) throw bad("লোগোর ছবি অনেক বড়");
    upd.logo = v;
  }
  if (upd.schoolName === "") throw bad("স্কুলের নাম দিন");
  if (b.classes !== undefined) {
    if (!Array.isArray(b.classes) || !b.classes.length) throw bad("কমপক্ষে একটি শ্রেণি দিন");
    const names = b.classes.map((c) => String(c.name || "").trim());
    if (names.some((n) => !n) || new Set(names).size !== names.length) throw bad("শ্রেণির নাম ফাঁকা বা ডুপ্লিকেট হতে পারে না");
    const removed = (await getSettings(true)).classes.map((c) => c.name).filter((n) => !names.includes(n));
    for (const n of removed) if (await Student.exists({ class: n, archived: { $ne: true } })) throw bad(`"${n}" শ্রেণিতে শিক্ষার্থী আছে — আগে সরান, তারপর শ্রেণি মুছুন`);
    upd.classes = b.classes.map((c) => ({ name: String(c.name).trim(), sections: [...new Set((c.sections || []).map((x) => String(x).trim()).filter(Boolean))] }));
  }
  if (typeof b.restrictTeachers === "boolean") upd.restrictTeachers = b.restrictTeachers;
  if (b.openingBalances) { upd.openingBalances = {}; for (const a of PAY_METHODS) upd.openingBalances[a] = num(b.openingBalances[a], "প্রারম্ভিক জের", { req: false, min: -1e9 }) ?? 0; }
  if (b.paymentMethods !== undefined) {
    if (!Array.isArray(b.paymentMethods) || b.paymentMethods.length > 20) throw bad("পেমেন্ট মাধ্যমের তালিকা সঠিক নয়");
    upd.paymentMethods = b.paymentMethods.map((m) => {
      const kind = String(m.kind || "");
      if (!["bkash", "nagad", "rocket", "bank", "other"].includes(kind)) throw bad("পেমেন্ট মাধ্যমের ধরন সঠিক নয়");
      const label = String(m.label || "").trim().slice(0, 60), accountNumber = String(m.accountNumber || "").trim().slice(0, 60);
      if (!label) throw bad("প্রতিটি পেমেন্ট মাধ্যমের নাম দিন");
      if (!accountNumber) throw bad(`"${label}" — অ্যাকাউন্ট নম্বর দিন`);
      return { id: /^[a-f0-9]{12}$/.test(m.id || "") ? m.id : crypto.randomBytes(6).toString("hex"), kind, label, accountNumber, accountType: String(m.accountType || "").trim().slice(0, 40), accountName: String(m.accountName || "").trim().slice(0, 80), instructions: String(m.instructions || "").trim().slice(0, 400), active: m.active !== false && m.active !== "false" };
    });
  }
  if (b.rolePermissions) {
    const rp = {};
    for (const [role, list] of Object.entries(b.rolePermissions)) {
      if (["superadmin", "student", "parent"].includes(role) || !ROLES.includes(role)) continue;
      if (!Array.isArray(list) || list.some((p) => !PERMISSIONS[p])) throw bad("অনুমতির তালিকা সঠিক নয়");
      rp[role] = list;
    }
    if (rp.admin && !rp.admin.includes("settings.manage")) throw bad("অ্যাডমিন থেকে সেটিংস অনুমতি সরানো যাবে না");
    upd.rolePermissions = rp; upd.permsKnown = Object.keys(PERMISSIONS);
  }
  await Settings.updateOne({ key: "main" }, { $set: upd }, { upsert: true });
  bustSettings();
  await audit(user, "update", "settings", null, { keys: Object.keys(upd) });
  return ok();
});
