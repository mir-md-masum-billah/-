import { cookies } from "next/headers";
import { LANGS } from "@/lib/translations";

// সার্ভার কম্পোনেন্টে বর্তমান ভাষা (কুকি `lang`; না থাকলে বাংলা)
export async function getLang() {
  const v = (await cookies()).get("lang")?.value;
  return LANGS.includes(v) ? v : "bn";
}
