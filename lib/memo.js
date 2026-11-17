// খুব ছোট মেয়াদের ইন-মেমরি ক্যাশ (প্রতি সার্ভার ইনস্ট্যান্সে)। ভারী কুয়েরি (ড্যাশবোর্ডের যোগফল, হোমপেজের গণনা)
// প্রতিটি রিকোয়েস্টে না চালিয়ে কয়েক সেকেন্ড ধরে রাখে — Vercel CPU/ডেটাবেজ খরচ কমায়।
const store = new Map();
const inflight = new Map();

export async function memo(key, ttlMs, fn) {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.v;
  if (inflight.has(key)) return inflight.get(key); // একই সময়ে একই কুয়েরি একবারই চলে
  const p = (async () => {
    try {
      const v = await fn();
      if (store.size > 200) store.clear();
      store.set(key, { v, exp: Date.now() + ttlMs });
      return v;
    } finally { inflight.delete(key); }
  })();
  inflight.set(key, p);
  return p;
}
export const memoClear = (prefix = "") => { for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k); };
