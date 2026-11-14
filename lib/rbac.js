// রোল ভিত্তিক অনুমতি। ডিফল্ট এখানে; Settings এ রোলভিত্তিক ওভাররাইড সংরক্ষিত থাকে।
export const ROLES = ["superadmin", "admin", "headmaster", "accountant", "teacher", "staff", "student", "parent"];
export const STAFF_ROLES = ["superadmin", "admin", "headmaster", "accountant", "teacher", "staff"];
export const roleLabel = { superadmin: "সুপার অ্যাডমিন", admin: "স্কুল অ্যাডমিন", headmaster: "প্রধান শিক্ষক", accountant: "হিসাবরক্ষক", teacher: "শিক্ষক", staff: "স্টাফ", student: "শিক্ষার্থী", parent: "অভিভাবক" };

export const PERMISSIONS = {
  "students.read": "শিক্ষার্থী দেখা", "students.write": "শিক্ষার্থী যোগ/এডিট/আর্কাইভ",
  "staff.read": "স্টাফ দেখা", "staff.write": "স্টাফ ম্যানেজ",
  "attendance.read": "হাজিরা দেখা", "attendance.write": "হাজিরা নেওয়া/সংশোধন",
  "results.read": "ফলাফল দেখা", "results.write": "ফলাফল এন্ট্রি/সংশোধন",
  "fees.read": "বেতন/ইনভয়েস দেখা", "fees.collect": "পেমেন্ট নেওয়া", "fees.manage": "ইনভয়েস তৈরি/পরিবর্তন, পেমেন্ট বাতিল/রিফান্ড",
  "accounts.read": "হিসাব দেখা", "accounts.write": "আয়-ব্যয় এন্ট্রি",
  "students.promote": "প্রমোশন/বদলি/রোল পুনর্বিন্যাস", "academics.manage": "সেশন, বিষয় ও শিক্ষক নিয়োগ",
  "applications.manage": "ভর্তির আবেদন দেখা/অনুমোদন", "staffattendance.read": "স্টাফ হাজিরা দেখা", "staffattendance.write": "স্টাফ হাজিরা নেওয়া",
  "leave.approve": "ছুটির আবেদন অনুমোদন",
  "notices.write": "নোটিশ প্রকাশ", "settings.manage": "সেটিংস ও অনুমতি", "audit.read": "অডিট লগ দেখা",
};
const ALL = Object.keys(PERMISSIONS);

export const DEFAULT_PERMS = {
  superadmin: ALL,
  admin: ALL,
  headmaster: ["students.read", "students.write", "students.promote", "academics.manage", "applications.manage", "staff.read", "attendance.read", "attendance.write", "staffattendance.read", "staffattendance.write", "leave.approve", "results.read", "results.write", "fees.read", "accounts.read", "notices.write", "audit.read"],
  accountant: ["students.read", "fees.read", "fees.collect", "fees.manage", "accounts.read", "accounts.write"],
  teacher: ["students.read", "attendance.read", "attendance.write", "results.read", "results.write"],
  staff: [],
  student: [], parent: [],
};

// superadmin সবসময় সব অনুমতি পায় (লক-আউট ঠেকাতে); অন্য রোলের জন্য Settings ওভাররাইড প্রযোজ্য
// known = ওভাররাইড সংরক্ষণের সময় যে অনুমতিগুলো ছিল। পরে নতুন যোগ হওয়া অনুমতি সেই রোলের ডিফল্ট অনুযায়ী পাওয়া যায় (আপগ্রেডে লক-আউট হয় না)
export function resolvePerms(role, overrides, known) {
  if (role === "superadmin") return ALL;
  const o = overrides?.[role];
  if (!Array.isArray(o)) return DEFAULT_PERMS[role] || [];
  const base = o.filter((p) => ALL.includes(p));
  const fresh = Array.isArray(known) ? (DEFAULT_PERMS[role] || []).filter((p) => !known.includes(p)) : [];
  return [...new Set([...base, ...fresh])];
}
// কে কোন রোল তৈরি/এডিট করতে পারবে
export const canAssignRole = (actor, target) => actor === "superadmin" || (actor === "admin" && !["superadmin", "admin"].includes(target));
