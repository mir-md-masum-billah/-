import Loader from "@/components/Loader";
import { getLang } from "@/lib/lang";
import { tr } from "@/lib/translations";

// পেজ বদলের সময় (ডেটা আনতে যতক্ষণ লাগে) দেখায়
export default async function Loading() {
  const t = tr(await getLang());
  return <div className="grid min-h-[70vh] place-items-center"><Loader label={t.splash.loading} /></div>;
}
