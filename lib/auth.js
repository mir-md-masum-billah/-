import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function secret() {
  const s = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!s || s.length < 32)) throw new Error("JWT_SECRET কমপক্ষে ৩২ অক্ষরের হতে হবে");
  return new TextEncoder().encode(s || "dev-only-secret-not-for-production-use");
}
export async function signToken(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(secret());
}
export async function verifyToken(token) {
  try { return (await jwtVerify(token, secret())).payload; } catch { return null; }
}
export async function getTokenPayload() {
  const t = (await cookies()).get("token")?.value;
  return t ? verifyToken(t) : null;
}
