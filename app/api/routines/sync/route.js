import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { handle, ok } from "@/lib/http";
import { syncAll } from "@/lib/routine-sync";
import { audit } from "@/lib/audit";

// বিদ্যমান রুটিন থেকে সব শ্রেণির ক্লাস টিচার/বিষয় শিক্ষক নিয়োগ একবারে মিলিয়ে নেওয়া
export const POST = handle(async () => {
  const user = await requireUser("academics.manage");
  await connectDB();
  const n = await syncAll();
  await audit(user, "sync", "assignments", "routine", { groups: n });
  return ok({ groups: n });
});
