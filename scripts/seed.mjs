// প্রথম সুপার অ্যাডমিন তৈরি: npm run seed
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../lib/models.js";

const pw = process.env.ADMIN_PASSWORD;
if (!pw || pw.length < 8 || pw === "ChangeMe123") { console.error("ADMIN_PASSWORD (কমপক্ষে ৮ অক্ষর, ডিফল্ট ছাড়া) সেট করুন"); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
const id = process.env.ADMIN_ID || "admin";
if (await User.findOne({ userId: id })) console.log("আগে থেকেই আছে:", id);
else { await User.create({ userId: id, password: await bcrypt.hash(pw, 10), name: "সুপার অ্যাডমিন", role: "superadmin" }); console.log("সুপার অ্যাডমিন তৈরি হয়েছে:", id); }
await mongoose.disconnect();
