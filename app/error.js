"use client";
import Link from "next/link";
import Crest from "@/components/Crest";
import { useLang } from "@/components/LangProvider";

// কোনো পেজে অপ্রত্যাশিত সমস্যা হলে সাদা পর্দার বদলে এটি দেখায়
export default function ErrorPage({ reset }) {
  const { t } = useLang();
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-16 text-center">
      <div className="max-w-md">
        <Crest className="mx-auto h-14 w-auto text-gold-deep" />
        <h1 className="mt-6 text-3xl text-brand-dark">{t.error.title}</h1>
        <span className="gold-rule mx-auto mt-4 !from-transparent !via-gold !to-transparent bg-gradient-to-r" />
        <p className="mt-5 leading-8 text-slate-600">{t.error.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="btn-primary !px-6 !py-3" onClick={() => reset()}>{t.error.retry}</button>
          <Link href="/" className="btn-ghost !px-6 !py-3">{t.error.home}</Link>
        </div>
      </div>
    </main>
  );
}
