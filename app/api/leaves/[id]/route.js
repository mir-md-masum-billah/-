import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { LeaveApplication } from "@/lib/models";
import { handle, ok, isId, HttpError } from "@/lib/http";
import { audit } from "@/lib/audit";

// নিজের অপেক্ষমাণ আবেদন বাতিল
export const DELETE = handle(async (_req, { params }) => {
  const u = await currentUser(); if (!u) throw new HttpError(401, "আবার লগইন করুন");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "আবেদন পাওয়া যায়নি");
  await connectDB();
  const l = await LeaveApplication.findById(id);
  if (!l) throw new HttpError(404, "আবেদন পাওয়া যায়নি");
  const mine = u.role === "student" ? String(l.student) === u.id : String(l.user) === u.id;
  if (!mine) throw new HttpError(403, "অনুমতি নেই");
  if (l.status !== "pending") throw new HttpError(409, "শুধু অপেক্ষমাণ আবেদন বাতিল করা যায়");
  l.status = "cancelled"; await l.save();
  await audit(u, "cancel", "leave", l._id, {});
  return ok();
});
