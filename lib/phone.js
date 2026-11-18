// ফোন নম্বর সহায়ক: বাংলা অঙ্ক (০–৯) ও ইংরেজি অঙ্ক দুটোই চলে; tel: লিংকে ইংরেজি অঙ্ক লাগে
const BN = "০১২৩৪৫৬৭৮৯";
export const toEnDigits = (s) => String(s ?? "").replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
export const telHref = (p) => `tel:${toEnDigits(p).replace(/[^\d+]/g, "")}`;
// বৈধ নম্বর: অঙ্ক, +, -, ফাঁকা ও () — অন্তত ৫টি অঙ্ক
export const validPhone = (p) => /^[\d+\-\s()]{5,30}$/.test(toEnDigits(p)) && toEnDigits(p).replace(/\D/g, "").length >= 5;
