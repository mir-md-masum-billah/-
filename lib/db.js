import mongoose from "mongoose";
let cached = global._mongoose || (global._mongoose = { conn: null, p: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI সেট করা নেই");
  cached.p = cached.p || mongoose.connect(process.env.MONGODB_URI);
  cached.conn = await cached.p;
  return cached.conn;
}

// একাধিক রেকর্ড একসাথে সফল/ব্যর্থ হওয়ার জন্য ট্রানজ্যাকশন।
// MongoDB Atlas (replica set) এ চলে। লোকাল standalone এ শুধু ALLOW_NO_TRANSACTIONS=1 দিলে (শুধু ডেভেলপমেন্ট) ছাড়া চলবে না।
export async function withTx(fn) {
  await connectDB();
  try {
    let result;
    await mongoose.connection.transaction(async (session) => { result = await fn(session); });
    return result;
  } catch (e) {
    if (/replica set|Transaction numbers/i.test(e.message || "")) {
      if (process.env.ALLOW_NO_TRANSACTIONS === "1" && process.env.NODE_ENV !== "production") return fn(null);
      throw new Error("ডেটাবেজে ট্রানজ্যাকশন সাপোর্ট নেই। MongoDB Atlas (replica set) ব্যবহার করুন।");
    }
    throw e;
  }
}
