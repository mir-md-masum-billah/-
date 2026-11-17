import mongoose from "mongoose";
import { fileURLToPath } from "node:url";

// .env.local নিজেই পড়ে নেবে (Code Runner দিয়ে চালালেও কাজ করবে)
process.loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url)));

const OLD = "https://0c4fa95e33b23c7fe9186806cb86e682.r2.cloudflarestorage.com/school";
const NEW = "https://pub-4873a6adbf2f4cccb40adc42f6fdb63f.r2.dev";

// true  = আসলে ডাটাবেজে পরিবর্তন করবে
// false = শুধু দেখাবে, কিছু বদলাবে না
const APPLY = true;

let count = 0;
function fix(v) {
    if (typeof v === "string") {
        if (v.startsWith(OLD)) { count++; return NEW + v.slice(OLD.length); }
        return v;
    }
    if (Array.isArray(v)) return v.map(fix);
    // ObjectId/Date ইত্যাদি বাদ, শুধু সাধারণ অবজেক্ট
    if (v && Object.getPrototypeOf(v) === Object.prototype) {
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)]));
    }
    return v;
}

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI পাওয়া যায়নি। .env.local ফাইলটা প্রজেক্ট ফোল্ডারে আছে কি না দেখুন।");
    process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

for (const { name } of await db.listCollections().toArray()) {
    if (name === "auditlogs") continue; // অডিট লগ অপরিবর্তিত থাকবে
    const col = db.collection(name);
    let changed = 0;
    for await (const doc of col.find({})) {
        const before = count;
        const { _id, ...rest } = doc;
        const fixed = fix(rest);
        if (count !== before) {
            changed++;
            if (APPLY) await col.replaceOne({ _id }, fixed);
        }
    }
    if (changed) console.log(`${name}: ${changed}টি ডকুমেন্ট ${APPLY ? "বদলানো হয়েছে" : "বদলাবে"}`);
}

console.log(`মোট ${count}টি URL ${APPLY ? "ঠিক করা হয়েছে" : "পাওয়া গেছে (এখনো কিছু বদলানো হয়নি)"}`);
await mongoose.disconnect();