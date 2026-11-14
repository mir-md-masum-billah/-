import { json, handle } from "@/lib/http";
import { getSettings } from "@/lib/settings";
// পাবলিক: শুধু শ্রেণির নাম (ভর্তির ফর্মের জন্য) — অন্য কোনো তথ্য নয়
export const GET = handle(async () => json({ classes: (await getSettings()).classes.map((c) => c.name) }));
