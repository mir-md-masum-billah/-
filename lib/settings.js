import { connectDB } from "@/lib/db";
import { Settings } from "@/lib/models";
import { school as defaults, classes as defClasses } from "@/lib/school";

let cache = { at: 0, v: null };
export async function getSettings(fresh = false) {
  if (!fresh && cache.v && Date.now() - cache.at < 15000) return cache.v;
  await connectDB();
  let s = await Settings.findOne({ key: "main" }).lean();
  if (!s) s = (await Settings.create({ key: "main", schoolName: defaults.name, tagline: defaults.tagline, address: defaults.address, phone: defaults.phone, email: defaults.email, about: defaults.about, classes: defClasses.map((name) => ({ name, sections: [] })) })).toObject();
  cache = { at: Date.now(), v: s };
  return s;
}
export const bustSettings = () => { cache = { at: 0, v: null }; };
