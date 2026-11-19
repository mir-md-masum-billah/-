import Icon from "./Icon";
import { telHref } from "@/lib/phone";

// হোমপেজে আলাদা আলাদা মানুষের ফোন নম্বর (সেটিংস থেকে যোগ করা)
export default function ContactStrip({ contacts, title }) {
  if (!contacts?.length) return null;
  return (
    <section id="phones" className="scroll-mt-16 bg-pearl">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-display text-3xl text-brand-dark sm:text-4xl">{title}</h2><span className="gold-rule mt-4" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c, i) => (
            <li key={i} className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-white p-4 shadow-sm">
              {c.photo ? <img src={c.photo} alt={c.name || c.role || ""} loading="lazy" className="h-16 w-16 shrink-0 rounded-full border-2 border-gold/60 object-cover object-top shadow-sm" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/60 bg-gold-light/60 text-gold-deep"><Icon name="phone" className="h-6 w-6" strokeWidth={1.4} /></span>}
              <div className="min-w-0">{c.role && <p className="truncate text-xs font-semibold uppercase tracking-wide text-gold-deep">{c.role}</p>}{c.name && <p className="truncate font-display text-lg text-brand-dark">{c.name}</p>}
                <a href={telHref(c.phone)} className="font-semibold text-brand hover:underline">{c.phone}</a></div>
            </li>))}
        </ul>
      </div>
    </section>
  );
}
