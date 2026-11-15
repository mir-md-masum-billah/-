import { connectDB } from "@/lib/db";
import { Notice } from "@/lib/models";
import { getSite } from "@/lib/site";
import { getLang } from "@/lib/lang";
import { tr, dateParts } from "@/lib/translations";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: tr(await getLang()).notices.meta }; }

export default async function Notices() {
  const lang = await getLang();
  const t = tr(lang);
  const school = await getSite(lang);
  let list = [];
  try { await connectDB(); list = await Notice.find().sort({ date: -1, createdAt: -1 }).lean(); } catch {}
  return (
    <div className="min-h-screen bg-pearl">
      <SiteHeader name={school.name} logo={school.logo} current="notices" />
      <section className="lattice hero-glow text-white">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-16">
          <h1 className="text-4xl text-white sm:text-5xl">{t.notices.title}</h1>
          <span className="gold-rule mt-5" />
          <p className="mt-4 text-white/75">{t.notices.sub}</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-5 py-12">
        {list.length === 0 && <p className="rounded-2xl border border-brand/10 bg-white p-8 text-center text-slate-500">{t.notices.empty}</p>}
        <div className="space-y-5">
          {list.map((n) => {
            const d = dateParts(n.date, lang);
            return (
              <article key={String(n._id)} className="grid gap-4 sm:grid-cols-[5.5rem_1fr] sm:gap-6">
                <div className="flex items-baseline gap-2 sm:block sm:border-r sm:border-gold/40 sm:pr-5 sm:text-right sm:leading-tight">
                  <p className="font-display text-3xl text-brand sm:text-4xl">{d ? d.day : "—"}</p>
                  <p className="text-sm text-slate-500">{d ? `${d.month} ${d.year}` : n.date}</p>
                </div>
                <div className="card !p-5 sm:!p-6">
                  <h2 className="text-lg font-bold leading-snug text-brand-dark sm:text-xl">{n.title}</h2>
                  {n.body && <p className="mt-2 whitespace-pre-line text-slate-700">{n.body}</p>}
                  {n.fileUrl && <a href={n.fileUrl} target="_blank" className="btn-ghost mt-4 !py-1.5 text-sm"><Icon name="file" className="h-4 w-4" /> {t.notices.file}</a>}
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <SiteFooter school={school} />
    </div>
  );
}
