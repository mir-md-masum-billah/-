import { connectDB } from "@/lib/db";
import { Settings } from "@/lib/models";
import { school as defaults, classes as defClasses } from "@/lib/school";

let cache = { at: 0, v: null };
export async function getSettings(fresh = false) {
  if (!fresh && cache.v && Date.now() - cache.at < 15000) return cache.v;
  await connectDB();
  let s = await Settings.findOne({ key: "main" }).lean();
  if (!s) s = (await Settings.create({ key: "main", schoolName: defaults.name, tagline: defaults.tagline, address: defaults.address, phone: defaults.phone, email: defaults.email, about: defaults.about, classes: defClasses.map((name) => ({ name, sections: [] })) })).toObject();
  // একবারের জন্য: "কেজি (KG)" শ্রেণি যোগ (নার্সারির পরে); পরে সেটিংস থেকে মুছলেও আর ফিরে আসবে না
  if (!s.kgAdded) {
    const cl = s.classes || [];
    if (!cl.some((c) => c.name === "কেজি")) { const i = cl.findIndex((c) => c.name === "নার্সারি"); const at = i >= 0 ? i + 1 : Math.min(2, cl.length); cl.splice(at, 0, { name: "কেজি", sections: [] }); }
    await Settings.updateOne({ key: "main" }, { $set: { classes: cl, kgAdded: true } });
    s = { ...s, classes: cl, kgAdded: true };
  }
  cache = { at: Date.now(), v: s };
  return s;
}
export const bustSettings = () => { cache = { at: 0, v: null }; };
