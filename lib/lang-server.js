import { cookies } from "next/headers";
import { translate } from "@/lib/i18n";

export async function getLang() { const c = await cookies(); return c.get("lang")?.value === "en" ? "en" : "bn"; }
export async function getTheme() { const c = await cookies(); const v = c.get("theme")?.value; return v === "dark" || v === "light" ? v : null; }
// সার্ভার কম্পোনেন্টে: const { t, lang } = await getT();
export async function getT() { const lang = await getLang(); return { lang, t: (k, p) => translate(lang, k, p) }; }
