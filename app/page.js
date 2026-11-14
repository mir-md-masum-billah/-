import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Notice, Student, User } from "@/lib/models";
import { school as defaults, bn } from "@/lib/school";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    await connectDB();
    const st = await getSettings();
    const [notices, students, teachers] = await Promise.all([
      Notice.find().sort({ date: -1, createdAt: -1 }).limit(5).lean(),
      Student.countDocuments({ active: true }),
      User.countDocuments({ active: true, role: "teacher" }),
    ]);
    return { notices, students, teachers, school: { ...defaults, name: st.schoolName || defaults.name, tagline: st.tagline || defaults.tagline, address: st.address || defaults.address, phone: st.phone || defaults.phone, email: st.email || defaults.email, about: st.about || defaults.about } };
  } catch { return { notices: [], students: null, teachers: null, school: defaults }; }
}

export default async function Home() {
  const { notices, students, teachers, school } = await getData();
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-brand sm:text-xl">{school.name}</span>
          <div className="flex items-center gap-1 sm:gap-3">
            <a href="#about" className="hidden px-2 text-sm font-medium sm:block">আমাদের সম্পর্কে</a>
            <Link href="/notices" className="hidden px-2 text-sm font-medium sm:block">নোটিশ</Link>
            <a href="#contact" className="hidden px-2 text-sm font-medium sm:block">যোগাযোগ</a>
            <Link href="/login" className="btn-primary !py-2">লগইন</Link>
          </div>
        </nav>
      </header>

      <section className="bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{school.name}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">{school.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-gold">শিক্ষার্থী লগইন</Link>
              <Link href="/admission" className="btn border border-white/40 text-white hover:bg-white/10">ভর্তির আবেদন</Link>
              <Link href="/notices" className="btn border border-white/40 text-white hover:bg-white/10">সব নোটিশ</Link>
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 text-ink">
            <h2 className="mb-3 text-lg font-bold text-brand">নোটিশ বোর্ড</h2>
            {notices.length === 0 ? <p className="text-slate-500">এখনো কোনো নোটিশ নেই।</p> : (
              <ul className="divide-y divide-slate-100">
                {notices.map((n) => (
                  <li key={n._id} className="py-2.5">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.date}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 sm:grid-cols-3">
        <div className="card text-center"><p className="text-3xl font-bold text-brand">{students === null ? "—" : bn(students)}</p><p className="text-slate-600">শিক্ষার্থী</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-brand">{teachers === null ? "—" : bn(teachers)}</p><p className="text-slate-600">শিক্ষক</p></div>
        <div className="card col-span-2 text-center sm:col-span-1"><p className="text-3xl font-bold text-brand">{school.established}</p><p className="text-slate-600">প্রতিষ্ঠা</p></div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-2xl font-bold">আমাদের সম্পর্কে</h2>
        <p className="mt-2 max-w-3xl text-slate-700">{school.about}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {school.features.map((f) => (
            <div key={f.t} className="card border-t-4 !border-t-gold">
              <h3 className="font-bold">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact" className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2">
          <div><h3 className="text-xl font-bold">{school.name}</h3><p className="mt-1 text-white/70">{school.tagline}</p></div>
          <div className="space-y-1 text-white/80"><p>📍 {school.address}</p><p>📞 {school.phone}</p><p>✉️ {school.email}</p></div>
        </div>
      </footer>
    </div>
  );
}
