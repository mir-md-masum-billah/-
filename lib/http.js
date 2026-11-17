import { NextResponse } from "next/server";

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const bad = (m) => new HttpError(400, m);
export const ok = (data = {}) => NextResponse.json({ ok: true, ...data });
export const json = (data, status = 200) => NextResponse.json(data, { status });

// পাবলিক ডেটা CDN-এ ক্যাশ হয় — একই তথ্যের জন্য বারবার ফাংশন/ডেটাবেজ চলে না (সার্ভার খরচ কমে)
export const cachedJson = (data, sMaxAge = 60) =>
  NextResponse.json(data, { headers: { "Cache-Control": `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 5}` } });

// সব রাউটে নিরাপদ এরর হ্যান্ডলিং — ভেতরের তথ্য ক্লায়েন্টে যায় না
export function handle(fn) {
  return async (req, ctx) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof SyntaxError && /JSON/i.test(e.message || "")) return NextResponse.json({ error: "অনুরোধের তথ্য সঠিক নয়" }, { status: 400 });
      if (e?.name === "ValidationError") return NextResponse.json({ error: Object.values(e.errors).map((x) => x.message).join(", ") }, { status: 400 });
      if (e?.name === "CastError") return NextResponse.json({ error: "অবৈধ মান" }, { status: 400 });
      if (e?.code === 11000) return NextResponse.json({ error: "এই তথ্য আগে থেকেই আছে (ডুপ্লিকেট)" }, { status: 409 });
      console.error("API error:", e);
      return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন" }, { status: 500 });
    }
  };
}

export const isId = (s) => typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);
export const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// অবজেক্টের নিজস্ব কী কি না ("constructor", "__proto__" এর মতো কী ফাঁকি দিতে পারবে না)
export const own = (obj, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(obj, key);
// ক্লায়েন্টের পাঠানো মান সবসময় স্ট্রিং (অবজেক্ট পাঠিয়ে কুয়েরি অপারেটর ঢোকানো ঠেকায়)
export const str = (v, max = 200) => (v === undefined || v === null ? "" : String(v).trim().slice(0, max));
export const clientIp = (req) => (req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();

export function num(v, label, { min = 0, max = 1e9, int = false, req = true } = {}) {
  if (v === undefined || v === null || v === "") { if (req) throw bad(`${label} দিন`); return undefined; }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) throw bad(`${label} সঠিক নয়`);
  return n;
}
