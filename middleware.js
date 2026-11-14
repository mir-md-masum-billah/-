import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// শুধু দ্রুত রিডাইরেক্ট। আসল যাচাই (নিষ্ক্রিয়/অনুমতি) প্রতিটি API ও লেআউটে সার্ভারে হয়
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const s = token ? await verifyToken(token) : null;
  const go = (p) => NextResponse.redirect(new URL(p, req.url));
  if (pathname.startsWith("/admin")) { if (!s) return go("/login"); if (s.role === "student" || s.role === "parent") return go("/student"); }
  if (pathname.startsWith("/student")) { if (!s) return go("/login"); if (s.role !== "student") return go("/admin"); }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/student/:path*"] };
