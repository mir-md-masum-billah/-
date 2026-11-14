import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { LeaveApplication } from "@/lib/models";
import { handle, json, bad, isId, HttpError } from "@/lib/http";
import { applyLeave } from "@/lib/leave";
import { audit } from "@/lib/audit";

export const POST = handle(async (req, { params }) => {
  const user = await requireUser("leave.approve");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "আবেদন পাওয়া যায়নি");
  await connectDB();
  const { approve, note } = await req.json();
  const n = String(note || "").trim().slice(0, 300);
  if (!approve && n.length < 3) throw bad("প্রত্যাখ্যানের কারণ লিখুন");
  const applied = await withTx(async (session) => {
    const l = await LeaveApplication.findById(id).session(session);
    if (!l) throw new HttpError(404, "আবেদন পাওয়া যায়নি");
    if (l.status !== "pending") throw new HttpError(409, "আবেদন আগেই নিষ্পত্তি হয়েছে");
    if (l.kind === "staff" && String(l.user) === user.id) throw new HttpError(403, "নিজের ছুটি নিজে অনুমোদন করা যায় না");
    l.set({ status: approve ? "approved" : "rejected", decidedByName: user.name, decidedAt: new Date(), decisionNote: n });
    await l.save({ session });
    return approve ? await applyLeave(l, user.name, session) : 0;
  });
  await audit(user, approve ? "approve" : "reject", "leave", id, { applied });
  return json({ ok: true, applied });
});
