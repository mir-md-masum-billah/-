import { getSettings } from "@/lib/settings";

// ওয়েবসাইটের ফেভিকন: সেটিংসে আপলোড করা স্কুলের লোগোই এখানে আসে; লোগো না থাকলে ডিফল্ট প্রতীক
// URL-এ ?v=<লোগোর হ্যাশ> থাকে (app/layout.js), লোগো বদলালে v বদলায় — তাই এটি দীর্ঘ সময় ক্যাশ করা নিরাপদ।
// আগে প্রতি পেজ লোডে ব্রাউজার ফাংশন চালাত (max-age=0); এখন ব্রাউজার ও CDN ক্যাশ ব্যবহার করে → সার্ভার খরচ কমে।
export const dynamic = "force-dynamic";
const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#04261E"/><g transform="translate(8 1) scale(.96)" fill="none" stroke="#E8D08A"><path d="M4 58V26C4 13.3 12.9 4 24 4s20 9.3 20 22v32" stroke-width="3"/><path d="M10 58V26c0-9.9 6-18 14-18s14 8.1 14 18v32" stroke-opacity=".55" stroke-width="1.6"/><g transform="translate(24 32)" stroke-width="2.4"><rect x="-7" y="-7" width="14" height="14"/><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)"/></g><path d="M1 58h46" stroke-width="3" stroke-linecap="round"/></g></svg>`;
const LONG = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
const SHORT = "public, max-age=300, s-maxage=300";
const fallback = (cc) => new Response(DEFAULT_SVG, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": cc } });

export async function GET(req) {
  const versioned = new URL(req.url).searchParams.has("v");
  const cc = versioned ? LONG : SHORT;
  let logo = "";
  try { logo = String((await getSettings()).logo || "").trim(); } catch {}
  if (!logo) return fallback(cc);
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(logo);
  if (m) return new Response(Buffer.from(m[2], "base64"), { headers: { "Content-Type": m[1], "Cache-Control": cc } });
  if (/^https?:\/\//.test(logo)) return Response.redirect(logo, 302);
  return fallback(cc);
}
