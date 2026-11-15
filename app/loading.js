import Loader from "@/components/Loader";
import { getLang } from "@/lib/lang";
import { getSite } from "@/lib/site";
import { tr } from "@/lib/translations";

// পেজ বদলের সময় (ডেটা আনতে যতক্ষণ লাগে) — রিফ্রেশের স্বাগত স্ক্রিনের মতোই পুরো স্ক্রিনে
export default async function Loading() {
  const lang = await getLang();
  const site = await getSite(lang);
  return <Loader full name={site.name} tagline={site.tagline} label={tr(lang).splash.loading} />;
}
