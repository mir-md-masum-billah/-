import Link from "next/link";
import Crest from "./Crest";
import Icon from "./Icon";
import { getLang } from "@/lib/lang";
import { tr, digits } from "@/lib/translations";
import { getDashboardHref } from "@/lib/session";
import { telHref } from "@/lib/phone";

export default async function SiteFooter({ school }) {
  const lang = await getLang();
  const t = tr(lang);
  const dash = await getDashboardHref();
  const links = [["/#about", t.nav.about], ["/notices", t.nav.notices], ["/admission", t.nav.admission], [dash || "/login", dash ? t.nav.dashboard : t.nav.login]];
  return (
    <footer id="contact" className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.3fr_0.8fr_1.2fr]">
        <div className="flex items-start gap-4">
          {school.logo ? <img src={school.logo} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-gold-soft/60" /> : <Crest className="h-14 w-auto shrink-0 text-gold-soft" />}
          <div>
            <p className="font-display text-2xl">{school.name}</p>
            <p className="mt-1 text-white/65">{school.tagline}</p>
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg text-gold-soft">{t.footer.links}</h2>
          <span className="gold-rule mt-2" />
          <ul className="mt-4 space-y-2 text-white/80">
            {links.map(([href, label]) => <li key={href}><Link href={href} className="transition hover:text-gold-soft">{label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg text-gold-soft">{t.footer.contact}</h2>
          <span className="gold-rule mt-2" />
          <ul className="mt-4 space-y-3 text-white/80">
            {school.address && <li className="flex items-start gap-3"><Icon name="pin" className="mt-1 h-5 w-5 shrink-0 text-gold-soft" /><span>{school.address}</span></li>}
            {school.phone && <li className="flex items-center gap-3"><Icon name="phone" className="h-5 w-5 shrink-0 text-gold-soft" /><a href={telHref(school.phone)} className="transition hover:text-gold-soft">{school.phone}</a></li>}
            {(school.contacts || []).map((c, i) => (
              <li key={i} className="flex items-start gap-3"><Icon name="phone" className="mt-1 h-5 w-5 shrink-0 text-gold-soft" />
                <span className="min-w-0"><span className="block text-white/60 text-sm">{[c.role, c.name].filter(Boolean).join(" — ")}</span><a href={telHref(c.phone)} className="font-semibold transition hover:text-gold-soft">{c.phone}</a></span></li>))}
            {school.email && <li className="flex items-center gap-3"><Icon name="mail" className="h-5 w-5 shrink-0 text-gold-soft" /><a href={`mailto:${school.email}`} className="break-all transition hover:text-gold-soft">{school.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-white/50">© {digits(new Date().getFullYear(), lang)} {school.name}। {t.footer.rights}</div>
    </footer>
  );
}
