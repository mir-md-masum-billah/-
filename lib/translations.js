// দুই ভাষার লেখা (বাংলা / English) — পাবলিক পেজ ও লগইনের জন্য। এখানে বদলালেই সব জায়গায় বদলে যায়।
import { bn } from "@/lib/school";

export const LANGS = ["bn", "en"];

export const schoolEn = {
  name: "Haji Chan Mia School",
  tagline: "Shaping enlightened people",
  about: "Haji Chan Mia School is a model educational institution. With experienced teachers, regular examinations and a disciplined environment, we work to bring out the talent in every student.",
  features: [
    { t: "Experienced teachers", d: "Lessons guided by trained and caring teachers." },
    { t: "Regular examinations", d: "Every exam result can be viewed online." },
    { t: "Online attendance and fees", d: "Log in with your ID to see attendance and fee records." },
    { t: "Discipline and ethics", d: "Alongside academics, we teach good conduct and values." },
  ],
};

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toEnDigits = (s) => String(s ?? "").replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d));
export const toBnDigits = (s) => String(s ?? "").replace(/\d/g, (d) => BN_DIGITS[d]);

const isYear = (n) => Number.isInteger(Number(n)) && Number(n) >= 1900 && Number(n) <= 2200; // বছর (২০২৬) — হাজারের কমা ছাড়া
export const num = (n, lang) => (isYear(n) ? (lang === "en" ? String(Number(n)) : toBnDigits(String(Number(n)))) : lang === "en" ? Number(n || 0).toLocaleString("en-US") : bn(n));
export const digits = (n, lang) => (lang === "en" ? String(n) : toBnDigits(n));

export function dateParts(s, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  if (!m) return null;
  const mi = Number(m[2]) - 1;
  return lang === "en"
    ? { day: String(Number(m[3])), month: EN_MONTHS[mi], year: m[1] }
    : { day: toBnDigits(Number(m[3])), month: BN_MONTHS[mi], year: toBnDigits(m[1]) };
}

export const dict = {
  bn: {
    switchLabel: "ভাষা",
    nav: { about: "আমাদের সম্পর্কে", notices: "নোটিশ", admission: "ভর্তি", contact: "যোগাযোগ", login: "লগইন", dashboard: "ড্যাশবোর্ড", menu: "প্রধান মেনু", home: "হোমপেজ" },
    hero: { login: "শিক্ষার্থী লগইন", apply: "ভর্তির আবেদন", students: "শিক্ষার্থী", teachers: "শিক্ষক", est: "প্রতিষ্ঠা" },
    board: { title: "নোটিশ বোর্ড", empty: "এখনো কোনো নোটিশ নেই।", all: "সব নোটিশ দেখুন", fresh: "নতুন" },
    about: { title: "আমাদের সম্পর্কে" },
    digital: {
      title: "ডিজিটাল ক্যাম্পাস",
      lead: "খাতার পাতা থেকে ফোনের পর্দায় — হাজিরা, ফলাফল আর বেতনের হিসাব এখন অভিভাবকের হাতের মুঠোয়।",
      body: "ভর্তি থেকে বার্ষিক ফলাফল পর্যন্ত স্কুলের প্রতিটি কাজ আমরা একটি নিরাপদ অনলাইন পোর্টালে সাজিয়েছি। শিক্ষকের সময় বাঁচে, অভিভাবক নিশ্চিন্ত থাকেন, আর শিক্ষার্থী নিজের অগ্রগতি নিজেই দেখতে পায়।",
      items: [
        { t: "প্রতিদিনের হাজিরা", d: "ক্লাস টিচার হাজিরা নেওয়ার সাথে সাথেই উপস্থিতি ও ছুটির হিসাব হালনাগাদ হয়।" },
        { t: "ফলাফল ও নম্বর", d: "প্রতিটি পরীক্ষার নম্বর ও ফলাফল শিক্ষার্থীর নিজের প্রোফাইলে সাজানো থাকে।" },
        { t: "বেতন ও রসিদ", d: "বকেয়া এক নজরে দেখা যায়, আর প্রতিটি পেমেন্টের আলাদা ডিজিটাল রসিদ মেলে।" },
        { t: "নোটিশ ও বিজ্ঞপ্তি", d: "পরীক্ষা, ছুটি বা অনুষ্ঠানের খবর ওয়েবসাইটেই সবার আগে পাওয়া যায়।" },
        { t: "অনলাইন ভর্তি", d: "ঘরে বসেই ফর্ম পূরণ করুন; স্কুল অফিস যাচাই করে ফোনে জানিয়ে দেবে।" },
        { t: "নিরাপদ তথ্য", d: "কে কী দেখবে তা ভূমিকা অনুযায়ী নিয়ন্ত্রিত; প্রতিটি পরিবর্তনের হিসাব থাকে।" },
      ],
      stepsTitle: "লগইনের পথ",
      steps: [
        { t: "স্কুল অফিস থেকে আইডি নিন", d: "ভর্তির পর শিক্ষার্থীর আইডি ও পাসওয়ার্ড দেওয়া হয়।" },
        { t: "লগইন করুন", d: "যেকোনো ফোন বা কম্পিউটারের ব্রাউজার থেকে।" },
        { t: "সব এক জায়গায় দেখুন", d: "হাজিরা, ফলাফল, বেতন ও রসিদ — সবই একই পর্দায়।" },
      ],
      cta: "পোর্টালে লগইন করুন",
    },
    cta: { title: "আপনার সন্তানের ভর্তির আবেদন এখন অনলাইনেই করুন", body: "ফর্ম জমা দিলে স্কুল অফিস যাচাই করে আপনার মোবাইল নম্বরে যোগাযোগ করবে।", apply: "ভর্তির আবেদন করুন", notices: "নোটিশ দেখুন" },
    footer: { rights: "সর্বস্বত্ব সংরক্ষিত।", links: "দ্রুত লিংক", contact: "যোগাযোগ" },
    notices: { title: "নোটিশ বোর্ড", sub: "স্কুলের সব বিজ্ঞপ্তি এক জায়গায়, নতুনগুলো উপরে।", empty: "এখনো কোনো নোটিশ নেই।", file: "সংযুক্ত ফাইল দেখুন", meta: "নোটিশ" },
    admission: {
      title: "ভর্তির আবেদন", note: "তারকা (*) চিহ্নিত ঘরগুলো পূরণ করা আবশ্যক।", meta: "ভর্তির আবেদন",
      student: "শিক্ষার্থীর তথ্য", guardian: "অভিভাবকের তথ্য", previous: "আগের পড়াশোনা",
      name: "শিক্ষার্থীর নাম", cls: "যে শ্রেণিতে ভর্তি হতে চায়", pick: "— বাছাই করুন —", gender: "লিঙ্গ", male: "ছেলে", female: "মেয়ে", other: "অন্যান্য", dob: "জন্ম তারিখ",
      father: "পিতার নাম", mother: "মাতার নাম", phone: "অভিভাবকের মোবাইল", address: "ঠিকানা",
      prevSchool: "আগের স্কুল (থাকলে)", prevClass: "আগের শ্রেণি", website: "ওয়েবসাইট",
      submit: "আবেদন জমা দিন", busy: "জমা হচ্ছে...", errGeneric: "সমস্যা হয়েছে", errNet: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন",
      doneTitle: "আবেদন জমা হয়েছে", doneBody: "স্কুল অফিস যাচাই করে আপনার মোবাইল নম্বরে যোগাযোগ করবে।", back: "হোমপেজে ফিরুন",
    },
    login: {
      title: "লগইন করুন", sub: "আপনার আইডি ও পাসওয়ার্ড দিন।", id: "আইডি", pw: "পাসওয়ার্ড", submit: "লগইন", busy: "অপেক্ষা করুন...",
      portal: "শিক্ষার্থী, অভিভাবক ও শিক্ষকদের জন্য অনলাইন পোর্টাল।", hint: "আইডি ও পাসওয়ার্ড স্কুল অফিস থেকে সংগ্রহ করুন।", home: "হোমপেজ",
    },
    themeLabel: "থিম",
    theme: { dark: "ডার্ক মোড চালু করুন", light: "লাইট মোড চালু করুন" },
    shell: {
      nav: { "/admin": "ড্যাশবোর্ড", "/admin/students": "শিক্ষার্থী", "/admin/applications": "ভর্তির আবেদন", "/admin/promotion": "প্রমোশন ও রোল", "/admin/academics": "শ্রেণি-বিষয়-নিয়োগ", "/admin/class-dashboard": "ক্লাস ড্যাশবোর্ড", "/admin/me": "আমার প্রোফাইল", "/admin/attendance": "হাজিরা", "/admin/attendance/report": "হাজিরা রিপোর্ট", "/admin/staff-attendance": "স্টাফ হাজিরা", "/admin/leave": "ছুটি", "/admin/routine": "ক্লাস রুটিন", "/admin/my-routine": "আমার রুটিন", "/admin/exams": "পরীক্ষার নোটিশ", "/admin/pay-requests": "অনলাইন পেমেন্ট যাচাই", "/admin/results": "পরীক্ষার ফলাফল", "/admin/fees": "বেতন ও ফি", "/admin/accounts": "হিসাব নিকাশ", "/admin/notices": "নোটিশ", "/admin/staff": "শিক্ষক ও স্টাফ", "/admin/settings": "সেটিংস", "/admin/audit": "অডিট লগ" },
      roles: { superadmin: "সুপার অ্যাডমিন", admin: "স্কুল অ্যাডমিন", headmaster: "প্রধান শিক্ষক", accountant: "হিসাবরক্ষক", teacher: "শিক্ষক", staff: "স্টাফ", student: "শিক্ষার্থী", parent: "অভিভাবক" },
      viewSite: "ওয়েবসাইট দেখুন", logout: "লগআউট", openMenu: "মেনু খুলুন",
    },
    notFound: { title: "পৃষ্ঠাটি খুঁজে পাওয়া যায়নি", body: "আপনি যে ঠিকানাটি খুঁজছেন সেটি সরানো হয়েছে, বদলে গেছে বা কখনো ছিলই না। নিচের যেকোনো পথে এগিয়ে যান।", home: "হোমপেজে ফিরুন", notices: "নোটিশ দেখুন", login: "লগইন করুন", meta: "পৃষ্ঠা পাওয়া যায়নি" },
    error: { title: "কিছু একটা ঠিকমতো হয়নি", body: "পেজটি এই মুহূর্তে খোলা যায়নি। একটু পরে আবার চেষ্টা করুন; সমস্যা থাকলে স্কুল অফিসে জানান।", retry: "আবার চেষ্টা করুন", home: "হোমপেজে ফিরুন" },
    student: {
      portalMenu: "পোর্টাল মেনু", tabs: { home: "প্রোফাইল", att: "হাজিরা", fee: "বেতন", res: "ফলাফল", lv: "ছুটি", not: "নোটিশ" },
      status: { present: "উপস্থিত", absent: "অনুপস্থিত", late: "দেরি", leave: "ছুটি", holiday: "হলিডে" },
      leaveStatus: { pending: "অপেক্ষমাণ", approved: "অনুমোদিত", rejected: "প্রত্যাখ্যাত", cancelled: "বাতিল" },
      methods: { cash: "নগদ (ক্যাশ)", bkash: "বিকাশ", nagad: "নগদ (Nagad)", rocket: "রকেট", bank: "ব্যাংক", other: "অন্যান্য" },
      errLoad: "তথ্য আনা যায়নি", errNet: "নেটওয়ার্ক সমস্যা — ইন্টারনেট যাচাই করুন", errGeneric: "সমস্যা হয়েছে", retry: "আবার চেষ্টা করুন", loading: "লোড হচ্ছে...",
      confirmCancel: "আবেদন বাতিল করবেন?", cancel: "বাতিল",
      cls: "শ্রেণি", roll: "রোল", id: "আইডি", attendance: "হাজিরা", paid: "মোট জমা", due: "বকেয়া", totalDue: "মোট বকেয়া",
      father: "পিতার নাম", mother: "মাতার নাম", guardianPhone: "অভিভাবকের মোবাইল", dob: "জন্ম তারিখ", address: "ঠিকানা", monthlyFee: "মাসিক বেতন",
      rate: "মোট উপস্থিতির হার (ছুটি/হলিডে বাদে)", noAtt: "এখনো হাজিরা নেই", cols: ["মাস", "উপস্থিত", "অনুপস্থিত", "দেরি", "ছুটি", "হার"], noAttRows: "কোনো হাজিরা নেই", recent: "সাম্প্রতিক হাজিরা",
      feeTitle: "ফি ও বকেয়া", feeCols: ["বিবরণ", "ধার্য", "জমা", "বকেয়া"], settled: "পরিশোধিত", noFees: "কোনো ফি নেই",
      payTitle: "পেমেন্টের ইতিহাস ও রসিদ", payCols: ["তারিখ", "রসিদ", "বিবরণ", "পদ্ধতি", "টাকা"], refund: "ফেরত", noPay: "কোনো পেমেন্ট নেই",
      noResults: "কোনো ফলাফল নেই।", resCols: ["বিষয়", "প্রাপ্ত", "পূর্ণমান"], total: "মোট",
      newLeave: "নতুন ছুটির আবেদন", from: "শুরু", to: "শেষ", reason: "কারণ", apply: "আবেদন করুন", wait: "অপেক্ষা করুন...", leaveCols: ["তারিখ", "কারণ", "অবস্থা", ""], noLeaves: "কোনো আবেদন নেই",
      noNotices: "কোনো নোটিশ নেই।", file: "সংযুক্ত ফাইল দেখুন",
    },
    splash: { loading: "লোড হচ্ছে…" },
  },
  en: {
    switchLabel: "Language",
    nav: { about: "About us", notices: "Notices", admission: "Admission", contact: "Contact", login: "Log in", dashboard: "Dashboard", menu: "Main menu", home: "Home" },
    hero: { login: "Student login", apply: "Apply for admission", students: "Students", teachers: "Teachers", est: "Established" },
    board: { title: "Notice board", empty: "There are no notices yet.", all: "View all notices", fresh: "New" },
    about: { title: "About us" },
    digital: {
      title: "The digital campus",
      lead: "From paper registers to the phone in your pocket, attendance, results and fee records are now within a parent's reach.",
      body: "From admission to the annual result, everything we do lives in one secure online portal. Teachers save time, parents stay informed, and students can follow their own progress.",
      items: [
        { t: "Daily attendance", d: "Attendance and leave are updated the moment the class teacher takes the roll." },
        { t: "Results and marks", d: "Marks and results from every exam are kept in the student's own profile." },
        { t: "Fees and receipts", d: "See what is due at a glance, and get a separate digital receipt for every payment." },
        { t: "Notices", d: "News about exams, holidays and events appears on the website first." },
        { t: "Online admission", d: "Fill in the form from home; the school office checks it and calls you back." },
        { t: "Safe records", d: "What each person can see depends on their role, and every change is logged." },
      ],
      stepsTitle: "How to log in",
      steps: [
        { t: "Get your ID from the school office", d: "A student ID and password are issued after admission." },
        { t: "Log in", d: "From the browser on any phone or computer." },
        { t: "See everything in one place", d: "Attendance, results, fees and receipts on a single screen." },
      ],
      cta: "Log in to the portal",
    },
    cta: { title: "Apply for your child's admission online", body: "After you submit the form, the school office will verify it and contact you on your mobile number.", apply: "Apply for admission", notices: "View notices" },
    footer: { rights: "All rights reserved.", links: "Quick links", contact: "Contact" },
    notices: { title: "Notice board", sub: "Every school announcement in one place, newest first.", empty: "There are no notices yet.", file: "Open attached file", meta: "Notices" },
    admission: {
      title: "Admission application", note: "Fields marked with an asterisk (*) are required.", meta: "Admission",
      student: "Student details", guardian: "Guardian details", previous: "Previous schooling",
      name: "Student's name", cls: "Class applying for", pick: "— Select —", gender: "Gender", male: "Boy", female: "Girl", other: "Other", dob: "Date of birth",
      father: "Father's name", mother: "Mother's name", phone: "Guardian's mobile", address: "Address",
      prevSchool: "Previous school (if any)", prevClass: "Previous class", website: "Website",
      submit: "Submit application", busy: "Submitting...", errGeneric: "Something went wrong", errNet: "Network problem. Please try again.",
      doneTitle: "Application submitted", doneBody: "The school office will verify it and contact you on your mobile number.", back: "Back to home",
    },
    login: {
      title: "Log in", sub: "Enter your ID and password.", id: "ID", pw: "Password", submit: "Log in", busy: "Please wait...",
      portal: "The online portal for students, parents and teachers.", hint: "Collect your ID and password from the school office.", home: "Home",
    },
    themeLabel: "Theme",
    theme: { dark: "Switch to dark mode", light: "Switch to light mode" },
    shell: {
      nav: { "/admin": "Dashboard", "/admin/students": "Students", "/admin/applications": "Admission applications", "/admin/promotion": "Promotion and rolls", "/admin/academics": "Classes, subjects, assignments", "/admin/class-dashboard": "Class dashboard", "/admin/me": "My profile", "/admin/attendance": "Attendance", "/admin/attendance/report": "Attendance report", "/admin/staff-attendance": "Staff attendance", "/admin/leave": "Leave", "/admin/routine": "Class routine", "/admin/my-routine": "My routine", "/admin/exams": "Exam notices", "/admin/pay-requests": "Online payment verification", "/admin/results": "Exam results", "/admin/fees": "Fees", "/admin/accounts": "Accounts", "/admin/notices": "Notices", "/admin/staff": "Teachers and staff", "/admin/settings": "Settings", "/admin/audit": "Audit log" },
      roles: { superadmin: "Super admin", admin: "School admin", headmaster: "Headmaster", accountant: "Accountant", teacher: "Teacher", staff: "Staff", student: "Student", parent: "Parent" },
      viewSite: "View website", logout: "Log out", openMenu: "Open menu",
    },
    notFound: { title: "Page not found", body: "The address you are looking for may have moved, changed, or never existed. Pick one of the paths below to continue.", home: "Back to home", notices: "View notices", login: "Log in", meta: "Page not found" },
    error: { title: "Something went wrong", body: "This page could not be opened right now. Please try again in a moment, and tell the school office if the problem continues.", retry: "Try again", home: "Back to home" },
    student: {
      portalMenu: "Portal menu", tabs: { home: "Profile", att: "Attendance", fee: "Fees", res: "Results", lv: "Leave", not: "Notices" },
      status: { present: "Present", absent: "Absent", late: "Late", leave: "Leave", holiday: "Holiday" },
      leaveStatus: { pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" },
      methods: { cash: "Cash", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "Bank", other: "Other" },
      errLoad: "Could not load your information", errNet: "Network problem. Please check your internet connection.", errGeneric: "Something went wrong", retry: "Try again", loading: "Loading...",
      confirmCancel: "Cancel this application?", cancel: "Cancel",
      cls: "Class", roll: "Roll", id: "ID", attendance: "Attendance", paid: "Total paid", due: "Due", totalDue: "Total due",
      father: "Father's name", mother: "Mother's name", guardianPhone: "Guardian's mobile", dob: "Date of birth", address: "Address", monthlyFee: "Monthly fee",
      rate: "Overall attendance rate (excluding leave and holidays)", noAtt: "No attendance yet", cols: ["Month", "Present", "Absent", "Late", "Leave", "Rate"], noAttRows: "No attendance records", recent: "Recent attendance",
      feeTitle: "Fees and dues", feeCols: ["Description", "Charged", "Paid", "Due"], settled: "Paid in full", noFees: "No fees",
      payTitle: "Payment history and receipts", payCols: ["Date", "Receipt", "Description", "Method", "Amount"], refund: "refund", noPay: "No payments",
      noResults: "No results yet.", resCols: ["Subject", "Obtained", "Full marks"], total: "Total",
      newLeave: "New leave application", from: "From", to: "To", reason: "Reason", apply: "Apply", wait: "Please wait...", leaveCols: ["Date", "Reason", "Status", ""], noLeaves: "No applications",
      noNotices: "No notices.", file: "Open attached file",
    },
    splash: { loading: "Loading…" },
  },
};
export const tr = (lang) => dict[lang] || dict.bn;

// টাকা, তারিখ ও মাসের নাম — ভাষা অনুযায়ী
export const moneyL = (n, lang) => "৳ " + num(n, lang);
export const dateL = (s, lang) => { const p = dateParts(s, lang); return p ? `${p.day} ${p.month} ${p.year}` : (s || ""); };
export const monthName = (i, lang) => (lang === "en" ? EN_MONTHS : BN_MONTHS)[i];
