import { NextResponse } from "next/server";
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const bad = (m) => new HttpError(400, m);
export const ok = (data = {}) => NextResponse.json({ ok: true, ...data });
export const json = (data, status = 200) => NextResponse.json(data, { status });

// সব রাউটে নিরাপদ এরর হ্যান্ডলিং — ভেতরের তথ্য ক্লায়েন্টে যায় না
export function handle(fn) {
  return async (req, ctx) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
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
export function num(v, label, { min = 0, max = 1e9, int = false, req = true } = {}) {
  if (v === undefined || v === null || v === "") { if (req) throw bad(`${label} দিন`); return undefined; }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) throw bad(`${label} সঠিক নয়`);
  return n;
}
