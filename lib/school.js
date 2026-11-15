// স্কুলের সাধারণ তথ্য — এখানে বদলালেই হোমপেজে বদলে যাবে
export const school = {
  name: "হাজী চান মিয়া স্কুল",
  tagline: "আলোকিত মানুষ গড়ার প্রতিষ্ঠান",
  address: "গ্রাম/এলাকা, উপজেলা, জেলা, বাংলাদেশ",
  phone: "০১৭XXXXXXXX",
  email: "info@example.com",
  established: "প্রতিষ্ঠা সাল লিখুন",
  about: "হাজী চান মিয়া স্কুল একটি আদর্শ শিক্ষাপ্রতিষ্ঠান। অভিজ্ঞ শিক্ষক, নিয়মিত পরীক্ষা ও শৃঙ্খলাবদ্ধ পরিবেশে আমরা প্রতিটি শিক্ষার্থীর মেধা বিকাশে কাজ করি।",
  features: [
    { t: "অভিজ্ঞ শিক্ষকমণ্ডলী", d: "প্রশিক্ষিত ও যত্নশীল শিক্ষকদের তত্ত্বাবধানে পাঠদান।" },
    { t: "নিয়মিত পরীক্ষা", d: "প্রতিটি পরীক্ষার ফলাফল অনলাইনে দেখা যায়।" },
    { t: "অনলাইন হাজিরা ও বেতন", d: "উপস্থিতি ও বেতনের হিসাব আইডি দিয়ে লগইন করলেই পাওয়া যায়।" },
    { t: "শৃঙ্খলা ও নৈতিকতা", d: "পড়ালেখার পাশাপাশি সুন্দর আচরণ ও মূল্যবোধ শেখানো হয়।" },
  ],
};
export const classes = ["প্লে", "নার্সারি", "১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম"];
export const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
export const bn = (n) => Number(n || 0).toLocaleString("bn-BD");
export const money = (n) => "৳ " + bn(n);
export const incomeCats = { fee: "ছাত্রছাত্রীর ফি", admission: "ভর্তি আয়", donation: "অনুদান/দান", grant: "সরকারি অনুদান", other: "অন্যান্য আয়" };
export const expenseCats = { teacher_salary: "শিক্ষকদের বেতন", staff_salary: "স্টাফ বেতন", electricity: "বিদ্যুৎ বিল", water: "পানির বিল", internet: "ইন্টারনেট বিল", stationery: "স্টেশনারি", books: "বই", furniture: "আসবাবপত্র", maintenance: "ভবন মেরামত", transport: "পরিবহন", exam: "পরীক্ষার খরচ", refund: "ফেরত (রিফান্ড)", other: "অন্যান্য ব্যয়" };
export const methodLabel = { cash: "নগদ (ক্যাশ)", bkash: "বিকাশ", nagad: "নগদ (Nagad)", bank: "ব্যাংক" };
export const feeCats = { admission: "ভর্তি ফি", tuition: "মাসিক বেতন", exam: "পরীক্ষা ফি", registration: "রেজিস্ট্রেশন ফি", session: "সেশন ফি", library: "লাইব্রেরি ফি", transport: "পরিবহন ফি", other: "অন্যান্য", fine: "জরিমানা" };

// ---- বাংলা তারিখ-সংখ্যা সহায়ক (নকশায় ব্যবহৃত) ----
export const bnNum = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
export function bnDateParts(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  if (!m) return null;
  return { day: bnNum(Number(m[3])), month: months[Number(m[2]) - 1], year: bnNum(m[1]) };
}
export function bnDate(s) { const p = bnDateParts(s); return p ? `${p.day} ${p.month} ${p.year}` : (s || ""); }
