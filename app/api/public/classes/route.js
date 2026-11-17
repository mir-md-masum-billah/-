import { cachedJson, handle } from "@/lib/http";
import { getSettings } from "@/lib/settings";
// পাবলিক: শুধু শ্রেণির নাম (ভর্তির ফর্মের জন্য) — অন্য কোনো তথ্য নয়
export const GET = handle(async () => { const c = (await getSettings()).classes; return cachedJson({ classes: c.map((x) => x.name), detail: c.map((x) => ({ name: x.name, sections: x.sections || [] })) }, 60); });
