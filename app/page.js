import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Notice, Student, User } from "@/lib/models";
import { getSite } from "@/lib/site";
import { getLang } from "@/lib/lang";
import { tr, dateParts, num, digits } from "@/lib/translations";
import { getDashboardHref } from "@/lib/session";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Icon from "@/components/Icon";
import ExamNoticeBoard from "@/components/ExamNoticeBoard";

export const dynamic = "force-dynamic";

async function getData(lang) {
  const school = await getSite(lang);
  try {
    await connectDB();
    const [notices, students, teachers] = await Promise.all([
      Notice.find().sort({ date: -1, createdAt: -1 }).limit(5).lean(),
      Student.countDocuments({ active: true }),
      User.countDocuments({ active: true, role: "teacher" }),
    ]);
    return { notices, students, teachers, school };
  } catch { return { notices: [], students: null, teachers: null, school }; }
}

const featureIcons = ["book", "clipboard", "monitor", "star"];
const digitalIcons = ["clipboard", "bars", "wallet", "megaphone", "file", "shield"];
const isFresh = (d) => { const t = Date.parse(d); return !Number.isNaN(t) && Date.now() - t < 14 * 864e5; };

export default async function Home() {
  const lang = await getLang();
  const t = tr(lang);
  const [{ notices, students, teachers, school }, dash] = await Promise.all([getData(lang), getDashboardHref()]);
  // প্রতিষ্ঠার সাল এখনো না বসানো থাকলে ("…লিখুন") নকশায় দেখানো হয় না
  const showEst = school.established && !String(school.established).includes("লিখুন");
  const stats = [
    { l: t.hero.students, v: students === null ? "—" : num(students, lang) },
    { l: t.hero.teachers, v: teachers === null ? "—" : num(teachers, lang) },
    ...(showEst ? [{ l: t.hero.est, v: school.established }] : []),
  ];

  return (
    <div>
      <SiteHeader name={school.name} logo={school.logo} current="home" />

      {/* ───── হিরো: গাঢ় সবুজ জমিন, ডানে তোরণের ভেতরে নোটিশ বোর্ড ───── */}
      <section className="lattice hero-glow relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-8 lg:pt-24">
          <div className="pb-2 lg:pb-24">
            <h1 className="text-[clamp(2.7rem,7.4vw,5.8rem)] leading-[1.2] text-white">{school.name}</h1>
            <span className="gold-rule mt-6" />
            <p className="mt-6 max-w-lg font-display text-xl leading-relaxed text-gold-soft sm:text-2xl">{school.tagline}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={dash || "/login"} className="btn-gold !px-7 !py-3 text-base">{dash ? t.nav.dashboard : t.hero.login}</Link>
              <Link href="/admission" className="btn-light !px-7 !py-3 text-base">{t.hero.apply}</Link>
            </div>
            <dl className="mt-12 flex flex-wrap gap-y-5 border-t border-white/15 pt-6">
              {stats.map((s) => (
                <div key={s.l} className="flex flex-col-reverse pr-8 sm:pr-12 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-gold/40 [&:not(:first-child)]:pl-8 sm:[&:not(:first-child)]:pl-12">
                  <dt className="text-sm text-white/65">{s.l}</dt>
                  <dd className="font-display text-3xl text-white sm:text-4xl">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* তোরণ — নিচের পাতার জমিনের সাথে মিশে গেছে, যেন দরজা দিয়ে ভেতরে ঢোকা */}
          <div className="arch-halo mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="arch-reveal">
              <div className="rounded-t-[999px] border border-b-0 border-gold-soft/60 p-2.5 pb-0">
                <div className="rounded-t-[999px] bg-pearl px-7 pb-10 pt-20 text-ink sm:px-9 sm:pt-24">
                  <h2 className="text-center font-display text-3xl text-brand-dark">{t.board.title}</h2>
                  <span className="gold-rule mx-auto mt-3 !from-transparent !via-gold !to-transparent bg-gradient-to-r" />
                  {notices.length === 0 ? (
                    <p className="mt-8 text-center text-slate-500">{t.board.empty}</p>
                  ) : (
                    <ul className="mt-6 divide-y divide-brand/10">
                      {notices.map((n) => {
                        const d = dateParts(n.date, lang);
                        return (
                          <li key={String(n._id)} className="flex gap-4 py-3.5">
                            <div className="w-12 shrink-0 text-center leading-tight">
                              <p className="font-display text-2xl text-brand">{d ? d.day : "—"}</p>
                              <p className="text-xs text-slate-500">{d ? d.month : ""}</p>
                            </div>
                            <p className="font-semibold leading-snug text-ink">
                              {n.title}
                              {isFresh(n.date) && <span className="ml-2 inline-block rounded-full bg-gold-light px-2 py-0.5 align-middle text-xs font-semibold text-gold-deep">{t.board.fresh}</span>}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Link href="/notices" className="mt-6 flex items-center justify-center gap-2 font-semibold text-brand hover:text-brand-dark">{t.board.all} <Icon name="arrowRight" className="h-4 w-4" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── আমাদের সম্পর্কে ───── */}
      <section id="about" className="scroll-mt-16 bg-pearl">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <h2 className="font-display text-4xl leading-tight text-brand-dark sm:text-5xl">{t.about.title}</h2>
            <span className="gold-rule mt-5" />
          </div>
          <div>
            <p className="max-w-2xl text-lg leading-9 text-slate-700">{school.about}</p>
            <ul className="mt-10 grid gap-x-10 sm:grid-cols-2">
              {school.features.map((f, i) => (
                <li key={f.t} className="flex gap-4 border-t border-gold/40 py-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/60 bg-gold-light/60 text-gold-deep">
                    <Icon name={featureIcons[i % featureIcons.length]} className="h-6 w-6" strokeWidth={1.4} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-brand-dark">{f.t}</h3>
                    <p className="mt-1 text-slate-600">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <ExamNoticeBoard />

      {/* ───── ডিজিটাল ক্যাম্পাস (আইটি সুবিধা) ───── */}
      <section id="digital" className="lattice hero-glow scroll-mt-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">{t.digital.title}</h2>
            <span className="gold-rule mt-5" />
            <p className="mt-7 font-display text-xl leading-relaxed text-gold-soft sm:text-2xl">{t.digital.lead}</p>
            <p className="mt-5 max-w-xl leading-8 text-white/75">{t.digital.body}</p>

            <h3 className="mt-10 font-display text-xl text-white">{t.digital.stepsTitle}</h3>
            <ol className="mt-5">
              {t.digital.steps.map((s, i) => (
                <li key={s.t} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < t.digital.steps.length - 1 && <span className="absolute left-[1.05rem] top-10 h-[calc(100%-2rem)] w-px bg-gold/40" aria-hidden="true" />}
                  <span className="grid h-[2.1rem] w-[2.1rem] shrink-0 place-items-center rounded-full border border-gold bg-night font-display text-gold-soft">{digits(i + 1, lang)}</span>
                  <div>
                    <p className="font-semibold text-white">{s.t}</p>
                    <p className="text-sm text-white/65">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={dash || "/login"} className="btn-gold mt-9 !px-7 !py-3 text-base">{dash ? t.nav.dashboard : t.digital.cta}</Link>
          </div>

          <ul className="grid content-start gap-x-10 sm:grid-cols-2">
            {t.digital.items.map((it, i) => (
              <li key={it.t} className="flex gap-4 border-t border-gold/35 py-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/60 text-gold-soft">
                  <Icon name={digitalIcons[i]} className="h-6 w-6" strokeWidth={1.4} />
                </span>
                <div>
                  <h3 className="font-display text-xl">{it.t}</h3>
                  <p className="mt-1 text-white/70">{it.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── ভর্তির আহ্বান ───── */}
      <section className="border-y border-gold/40 bg-gold-light">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl leading-snug text-brand-dark sm:text-4xl">{t.cta.title}</h2>
            <p className="mt-3 text-slate-700">{t.cta.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admission" className="btn-primary !px-7 !py-3 text-base">{t.cta.apply}</Link>
            <Link href="/notices" className="btn-ghost !px-7 !py-3 text-base">{t.cta.notices}</Link>
          </div>
        </div>
      </section>

      <SiteFooter school={school} />
    </div>
  );
}
