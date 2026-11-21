"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import Loader from "./Loader";
import { useLang } from "./LangProvider";
import { months } from "@/lib/school";
import { todayDhaka } from "@/lib/dates";

const ST = { present: ["উপস্থিত", "bg-green-100 text-green-800 border-green-300"], late: ["দেরি", "bg-yellow-100 text-yellow-800 border-yellow-300"], absent: ["অনুপস্থিত", "bg-red-100 text-red-700 border-red-300"], leave: ["ছুটি", "bg-amber-100 text-amber-800 border-amber-300"], holiday: ["হলিডে", "bg-sky-100 text-sky-800 border-sky-300"] };
const WD = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"]; // সপ্তাহ শনিবার থেকে; শুক্রবার সাপ্তাহিক ছুটি

// ক্যালেন্ডারের মতো হাজিরা: কোন তারিখে উপস্থিত/অনুপস্থিত/দেরি/ছুটি/হলিডে — রঙ দিয়ে। মাস ধরে লোড হয় (loadMonth) অথবা সব রেকর্ড আগেই দেওয়া থাকে (records)।
export default function AttendanceCalendar({ title, loadMonth, records, onClose }) {
  const { x, n } = useLang();
  const t = todayDhaka(); const [ym, setYm] = useState(t.slice(0, 7)); const [map, setMap] = useState(null); const [err, setErr] = useState("");
  useEffect(() => {
    let dead = false; setMap(null); setErr("");
    (async () => {
      try { const rows = records ? records.filter((r) => String(r.date).startsWith(ym)) : await loadMonth(ym); if (!dead) setMap(Object.fromEntries(rows.map((r) => [String(r.date).slice(0, 10), r.status]))); } catch (e) { if (!dead) setErr(e.message || x("লোড করা যায়নি")); }
    })();
    return () => { dead = true; };
  }, [ym]); // eslint-disable-line
  const [Y, M] = ym.split("-").map(Number); const days = new Date(Date.UTC(Y, M, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(Y, M - 1, 1)).getUTCDay() + 1) % 7; // শনি = 0
  const shift = (d) => { const dt = new Date(Date.UTC(Y, M - 1 + d, 1)); setYm(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`); };
  const cnt = {}; if (map) Object.values(map).forEach((s) => { cnt[s] = (cnt[s] || 0) + 1; });
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <Modal title={title || x("হাজিরা ক্যালেন্ডার")} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => shift(-1)}>‹</button><b className="text-lg text-brand-dark">{x(months[M - 1])} {n(Y).replace(/[,،]/g, "")}</b><button type="button" className="btn-ghost !px-3 !py-1.5" disabled={ym >= t.slice(0, 7)} onClick={() => shift(1)}>›</button></div>
        {err && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        {!map && !err ? <Loader compact label={x("লোড হচ্ছে...")} /> : map && <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">{WD.map((w, i) => <div key={w} className={i === 6 ? "text-sky-700" : ""}>{x(w)}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">{cells.map((d, i) => {
            if (d === null) return <div key={"e" + i} />;
            const date = `${ym}-${String(d).padStart(2, "0")}`, s = map[date], fri = (lead + d - 1) % 7 === 6, future = date > t;
            const cls = s ? ST[s][1] : future ? "border-slate-100 bg-white text-slate-300" : fri ? "border-sky-100 bg-sky-50 text-sky-600" : "border-slate-200 bg-slate-50 text-slate-400";
            return <div key={date} title={s ? x(ST[s][0]) : fri ? x("সাপ্তাহিক ছুটি") : future ? "" : x("হাজিরা নেওয়া হয়নি")} className={`grid aspect-square place-items-center rounded-lg border text-sm font-bold ${cls} ${date === t ? "ring-2 ring-gold" : ""}`}><span>{n(d)}<span className="block text-[9px] font-normal leading-none">{s ? x(ST[s][0]) : fri ? x("শুক্র") : ""}</span></span></div>;
          })}</div>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">{Object.entries(ST).map(([k, [l, c]]) => <span key={k} className={`rounded-full border px-2.5 py-1 font-semibold ${c}`}>{x(l)}: {n(cnt[k] || 0)}</span>)}</div>
        </>}
      </div>
    </Modal>
  );
}
