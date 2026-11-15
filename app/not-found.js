import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Crest from "@/components/Crest";
import { getSite } from "@/lib/site";
import { getLang } from "@/lib/lang";
import { tr, digits } from "@/lib/translations";

export async function generateMetadata() { return { title: tr(await getLang()).notFound.meta }; }

export default async function NotFound() {
  const lang = await getLang();
  const t = tr(lang).notFound;
  const school = await getSite(lang);
  return (
    <div className="min-h-screen">
      <SiteHeader name={school.name} logo={school.logo} />
      <section className="lattice hero-glow text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-0 pt-16 text-center sm:pt-20">
          <div className="w-full max-w-xs rounded-t-[999px] border border-b-0 border-gold-soft/60 p-2.5 pb-0">
            <div className="flex flex-col items-center rounded-t-[999px] bg-pearl px-6 pb-10 pt-16 text-brand-dark">
              <Crest className="h-10 w-auto text-gold-deep" />
              <p className="mt-3 font-display text-7xl leading-none sm:text-8xl">{digits(404, lang)}</p>
            </div>
          </div>
        </div>
      </section>
      <main className="bg-pearl">
        <div className="mx-auto max-w-xl px-5 py-14 text-center">
          <h1 className="text-3xl text-brand-dark sm:text-4xl">{t.title}</h1>
          <span className="gold-rule mx-auto mt-4 !from-transparent !via-gold !to-transparent bg-gradient-to-r" />
          <p className="mt-5 leading-8 text-slate-600">{t.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary !px-6 !py-3">{t.home}</Link>
            <Link href="/notices" className="btn-ghost !px-6 !py-3">{t.notices}</Link>
            <Link href="/login" className="btn-ghost !px-6 !py-3">{t.login}</Link>
          </div>
        </div>
      </main>
      <SiteFooter school={school} />
    </div>
  );
}
