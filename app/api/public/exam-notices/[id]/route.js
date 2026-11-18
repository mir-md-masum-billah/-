import { connectDB } from "@/lib/db";
import { ExamNotice } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";

export const GET = handle(async (_r, { params }) => {
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  await connectDB();
  const e = await ExamNotice.findOne({ _id: id, status: "published", archived: { $ne: true } }).select("-createdByName -batch").lean();
  if (!e) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  return json(e);
});
