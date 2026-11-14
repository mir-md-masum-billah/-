import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Notice } from "@/lib/models";

export const dynamic = "force-dynamic";
export const metadata = { title: "নোটিশ" };

export default async function Notices() {
  let list = [];
  try { await connectDB(); list = await Notice.find().sort({ date: -1, createdAt: -1 }).lean(); } catch {}
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-brand">← হোমপেজ</Link>
      <h1 className="mb-4 mt-2 text-3xl font-bold">নোটিশ</h1>
      <div className="space-y-3">
        {list.length === 0 && <p className="text-slate-500">কোনো নোটিশ নেই।</p>}
        {list.map((n) => (
          <article key={String(n._id)} className="card">
            <p className="text-xs text-slate-500">{n.date}</p>
            <h2 className="text-lg font-bold">{n.title}</h2>
            {n.body && <p className="mt-1 whitespace-pre-line text-slate-700">{n.body}</p>}
            {n.fileUrl && <a href={n.fileUrl} target="_blank" className="btn-ghost mt-3 !py-1.5 text-sm">সংযুক্ত ফাইল দেখুন</a>}
          </article>
        ))}
      </div>
    </main>
  );
}
