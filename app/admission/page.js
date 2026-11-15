import { getSite } from "@/lib/site";
import { getLang } from "@/lib/lang";
import { tr } from "@/lib/translations";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AdmissionForm from "@/components/AdmissionForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: tr(await getLang()).admission.meta }; }

export default async function Admission() {
  const lang = await getLang();
  const t = tr(lang);
  const school = await getSite(lang);
  return (
    <div className="min-h-screen bg-pearl">
      <SiteHeader name={school.name} logo={school.logo} current="admission" />
      <section className="lattice hero-glow text-white">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
          <h1 className="text-4xl text-white sm:text-5xl">{t.admission.title}</h1>
          <span className="gold-rule mt-5" />
          <p className="mt-4 text-white/75">{school.name} — {t.admission.note}</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl px-5 py-12"><AdmissionForm /></main>
      <SiteFooter school={school} />
    </div>
  );
}
