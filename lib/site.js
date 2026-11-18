import { school as defaults, realOnly } from "@/lib/school";
import { getSettings } from "@/lib/settings";
import { schoolEn, toEnDigits } from "@/lib/translations";

// পাবলিক পেজের হেডার/ফুটারের জন্য স্কুলের তথ্য — ডেটাবেজ না থাকলেও ডিফল্ট দিয়ে চলে
// lang === "en" হলে নাম, ট্যাগলাইন, পরিচিতি ও বৈশিষ্ট্য ইংরেজি ডিফল্ট থেকে আসে (lib/translations.js)
export async function getSite(lang = "bn") {
  let base;
  try {
    const st = await getSettings();
    base = { ...defaults, nameEn: st.schoolNameEn || "", taglineEn: st.taglineEn || "", name: st.schoolName || defaults.name, tagline: st.tagline || defaults.tagline, address: st.address || defaults.address, phone: st.phone || defaults.phone, email: st.email || defaults.email, about: st.about || defaults.about, logo: st.logo || "", contacts: (st.contacts || []).filter((c) => c.phone).map((c) => ({ name: c.name || "", role: c.role || "", phone: c.phone })) };
  } catch { base = { ...defaults, logo: "", contacts: [] }; }
  base = { ...base, address: realOnly(base.address), phone: realOnly(base.phone), email: realOnly(base.email), established: realOnly(base.established) };
  if (lang !== "en") return base;
  return { ...base, ...schoolEn, name: base.nameEn || schoolEn.name, tagline: base.taglineEn || schoolEn.tagline, established: toEnDigits(base.established) };
}
