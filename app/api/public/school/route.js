import { handle, cachedJson } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { realOnly } from "@/lib/school";

// লগইন ছাড়া — PDF/প্রিন্টের হেডারের জন্য স্কুলের নাম (বাংলা-ইংরেজি), স্লোগান, লোগো, ঠিকানা
export const GET = handle(async () => {
  const s = await getSettings();
  return cachedJson({ name: s.schoolName, nameEn: s.schoolNameEn || "", tagline: s.tagline || "", taglineEn: s.taglineEn || "", address: realOnly(s.address), phone: realOnly(s.phone), email: realOnly(s.email), logo: s.logo || "" }, 60);
});
