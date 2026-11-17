"use client";
import { useRef } from "react";
import { useLang } from "./LangProvider";

// YouTube/Vimeo লিংক থেকে এমবেড ঠিকানা; সরাসরি ভিডিও ফাইল হলে <video>; অন্য কিছু হলে লিংক কার্ড
export function embedOf(url) {
  const u = String(url || "").trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { kind: "iframe", src: `https://www.youtube.com/embed/${m[1]}` };
  m = u.match(/vimeo\.com\/(\d+)/); if (m) return { kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}` };
  if (/facebook\.com|fb\.watch/.test(u)) return { kind: "iframe", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return { kind: "video", src: u };
  return { kind: "link", src: u };
}

// হোমপেজের ভিডিও সারি: বামে-ডানে স্ক্রল করে যে ভিডিও ইচ্ছা দেখা যায়
export default function VideoStrip({ videos }) {
  const { x } = useLang(); const ref = useRef(null);
  if (!videos?.length) return null;
  const go = (d) => ref.current?.scrollBy({ left: d * Math.min(420, ref.current.clientWidth * 0.85), behavior: "smooth" });
  return (
    <section id="videos" className="scroll-mt-16 bg-night py-12 text-white">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-5 flex items-end justify-between gap-4"><h2 className="font-display text-3xl sm:text-4xl">{x("ভিডিও")}</h2>
          <div className="flex gap-2"><button aria-label="←" onClick={() => go(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-gold/60 text-gold-soft hover:bg-white/10">‹</button><button aria-label="→" onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full border border-gold/60 text-gold-soft hover:bg-white/10">›</button></div></div>
        <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "thin" }}>
          {videos.map((v, i) => { const e = embedOf(v.url); return (
            <figure key={i} className="w-[84%] shrink-0 snap-start sm:w-[420px]">
              <div className="aspect-video overflow-hidden rounded-xl border border-gold/40 bg-black">
                {e.kind === "iframe" ? <iframe src={e.src} title={v.title || `video ${i + 1}`} loading="lazy" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                  : e.kind === "video" ? <video src={e.src} controls preload="metadata" className="h-full w-full" />
                  : <a href={e.src} target="_blank" rel="noopener noreferrer" className="grid h-full w-full place-items-center text-gold-soft underline">{x("ভিডিও দেখুন")}</a>}
              </div>
              {v.title && <figcaption className="mt-2 font-semibold text-white/90">{v.title}</figcaption>}
            </figure>); })}
        </div>
      </div>
    </section>
  );
}
