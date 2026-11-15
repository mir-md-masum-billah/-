import Loader from "@/components/Loader";
import { getLang } from "@/lib/lang";
import { tr } from "@/lib/translations";

// অ্যাডমিন প্যানেলের ভেতরে পেজ বদলালে মেনু ঠিক থাকে, শুধু ভেতরের অংশে লোডিং
export default async function AdminLoading() {
  return <Loader compact label={tr(await getLang()).splash.loading} />;
}
