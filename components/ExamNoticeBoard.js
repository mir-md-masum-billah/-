"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useLang } from "./LangProvider";
import { fmtTime } from "./AdmitCardView";

// হোমপেজ: শ্রেণি ও শাখা বেছে পরীক্ষার নোটিশ দেখা এবং রুটিন PDF ডাউনলোড/প্রিন্ট (লগইন ছাড়াই)
export default function ExamNoticeBoard() {
  const { x, date, money } = useLang();
  const [any, setAny] = useState(null); const [classes, setClasses] = useState([]); const [cls, setCls] = useState(""); const [sec, setSec] = useState(""); const [items, setItems] = useState(null);
  useEffect(() => { fetch("/api/public/exam-notices").then((r) => r.json()).then((j) => setAny((j.items || []).length)).catch(() => setAny(1)); }, []);
  useEffect(() => { fetch("/api/public/classes").then((r) => r.json()).then((j) => setClasses(j.detail || [])).catch(() => {}); }, []);
  useEffect(() => { setItems(null); const q = cls ? `?class=${encodeURIComponent(cls)}${sec ? `&section=${encodeURIComponent(sec)}` : ""}` : ""; fetch("/api/public/exam-notices" + q).then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => setItems([])); }, [cls, sec]);
  const secs = classes.find((c) => c.name === cls)?.sections || [];
  if (any === 0) return null; // কোনো পরীক্ষা না থাকলে সেকশনটি পুরোপুরি বন্ধ — হোমপেজে দেখাবে না
  return (
    <section id="exams" className="scroll-mt-16 border-y border-gold/30 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-4xl text-brand-dark">{x("পরীক্ষার নোটিশ ও রুটিন")}</h2><span className="gold-rule mt-4" /></div>
          <div className="flex flex-wrap items-center gap-2"><Link href="/exam-notice/all" className="btn-gold !py-2 text-sm"><Icon name="file" className="h-4 w-4" /> {x("সব ক্লাসের রুটিন একসাথে")}</Link><select className="input !w-auto" aria-label={x("শ্রেণি")} value={cls} onChange={(e) => { setCls(e.target.value); setSec(""); }}><option value="">{x("সব শ্রেণি")}</option>{classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select>
            {secs.length > 0 && <select className="input !w-auto" aria-label={x("শাখা")} value={sec} onChange={(e) => setSec(e.target.value)}><option value="">{x("সব শাখা")}</option>{secs.map((s) => <option key={s}>{s}</option>)}</select>}</div></div>
        {!items ? <p className="mt-8 text-slate-500">{x("লোড হচ্ছে...")}</p> : items.length === 0 ? <p className="mt-8 rounded-2xl border border-brand/10 bg-pearl p-8 text-center text-slate-500">{x("এই শ্রেণির কোনো পরীক্ষার নোটিশ এখন নেই")}</p> :
          <div className="mt-8 grid gap-5 md:grid-cols-2">{items.map((e) => { const rows = [...e.schedule].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)); return (
            <article key={e._id} className="card flex flex-col !p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-brand-dark">{e.name}</h3><p className="text-sm text-slate-500">{x(e.class)}{e.section ? ` (${e.section})` : ` · ${x("সব শাখা")}`}{e.fee > 0 ? ` · ${x("ফি")} ${money(e.fee)}` : ""}</p></div></div>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">{rows.slice(0, 5).map((r, i) => <li key={i} className="flex justify-between gap-3 py-1.5"><span className="font-semibold">{x(r.subject)}</span><span className="text-slate-600">{date(r.date)} · {fmtTime(r.startTime)}</span></li>)}{rows.length > 5 && <li className="py-1.5 text-xs text-slate-500">{x("আরও {0} টি বিষয়...", rows.length - 5)}</li>}</ul>
              <Link href={`/exam-notice/${e._id}`} className="btn-primary mt-4 self-start !py-2 text-sm"><Icon name="file" className="h-4 w-4" /> {x("রুটিন PDF ডাউনলোড / প্রিন্ট")}</Link></article>); })}</div>}
      </div>
    </section>
  );
}
