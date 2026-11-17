import { requireUser } from "@/lib/guard";
import { handle, json } from "@/lib/http";
import { activeMethods } from "@/lib/pay";

// লগইন করা যে কেউ (শিক্ষার্থী সহ) শুধু সক্রিয় মাধ্যমগুলো দেখে
export const GET = handle(async () => {
  await requireUser();
  const items = (await activeMethods()).map((m) => ({ id: m.id, kind: m.kind, label: m.label, accountNumber: m.accountNumber, accountType: m.accountType, accountName: m.accountName, instructions: m.instructions }));
  return json({ items });
});
