"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useLang } from "./LangProvider";
import { printUrl } from "@/lib/print";

// কী কী প্রিন্ট হবে বেছে নেওয়ার জানালা: প্রোফাইল / পেমেন্ট ইতিহাস / ফলাফল — একটি, দুটি বা সবগুলো একসাথে।
// ফলাফল: সব পরীক্ষা একসাথে, শুধু একটি বছরের, বা একটি নির্দিষ্ট পরীক্ষা। শিক্ষক/অ্যাডমিন (admin) ও শিক্ষার্থী — দুজনেই ব্যবহার করে।
export default function PrintChooser({ id, admin = false, canPay = true, preset = {}, onClose }) {
  const { x, n } = useLang();
  const [on, setOn] = useState({ profile: !!preset.profile, pay: !!preset.pay, fees: !!preset.fees, results: !!preset.results });
  const [items, setItems] = useState(null); const [scope, setScope] = useState("all"); const [year, setYear] = useState(""); const [exam, setExam] = useState("");
  useEffect(() => { fetch(`/api/results/cards?list=1${admin ? `&student=${id}` : ""}`).then((r) => r.json()).then((j) => setItems(j.items || [])).catch(() => setItems([])); }, []); // eslint-disable-line
  const years = [...new Set((items || []).map((i) => i.year))];
  const tog = (k) => setOn((o) => ({ ...o, [k]: !o[k] }));
  const any = on.profile || (on.pay && canPay) || (on.fees && canPay) || on.results;
  function go() {
    const parts = ["profile", "pay", "fees", "results"].filter((k) => on[k] && (!["pay", "fees"].includes(k) || canPay));
    let u = `${admin ? `/admin/students/${id}/print` : "/student/print"}?parts=${parts.join(",")}`;
    if (on.results) { if (scope === "year" && year) u += `&year=${year}`; if (scope === "exam" && exam) { const [e, y] = exam.split("|"); u += `&exam=${encodeURIComponent(e)}&year=${y}`; } }
    printUrl(u); onClose();
  }
  const row = (k, label, disabled) => <label className={`flex items-center gap-2 rounded-lg border border-slate-200 p-3 ${disabled ? "opacity-50" : ""}`}><input type="checkbox" disabled={disabled} checked={!!on[k]} onChange={() => tog(k)} /><span className="font-semibold">{label}</span></label>;
  return (
    <Modal title={x("কী কী প্রিন্ট করবেন?")} onClose={onClose}>
      <div className="space-y-3 text-sm">
        {row("profile", x("শিক্ষার্থীর প্রোফাইল"))}
        {canPay && row("pay", x("পেমেন্ট ইতিহাস"))}
        {canPay && row("fees", x("ফি বিবরণী (কোন মাসে কত বকেয়া ও কোন মাসে পরিশোধ)"))}
        {row("results", x("ফলাফল (রেজাল্ট কার্ড)"), items && items.length === 0)}
        {on.results && items && items.length > 0 && <div className="space-y-2 rounded-lg bg-brand-light/50 p-3">
          <label className="flex items-center gap-2"><input type="radio" checked={scope === "all"} onChange={() => setScope("all")} /> {x("সব পরীক্ষার ফলাফল একসাথে")} ({n(items.length)})</label>
          <label className="flex items-center gap-2"><input type="radio" checked={scope === "year"} onChange={() => { setScope("year"); setYear(year || String(years[years.length - 1])); }} /> {x("শুধু একটি বছরের ফলাফল")}
            {scope === "year" && <select className="input !w-auto !py-1" value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y} value={y}>{n(y).replace(/[,،]/g, "")}</option>)}</select>}</label>
          <label className="flex items-center gap-2"><input type="radio" checked={scope === "exam"} onChange={() => { setScope("exam"); setExam(exam || `${items[0].exam}|${items[0].year}`); }} /> {x("একটি নির্দিষ্ট পরীক্ষা")}
            {scope === "exam" && <select className="input !w-auto !py-1" value={exam} onChange={(e) => setExam(e.target.value)}>{items.map((i) => <option key={`${i.exam}|${i.year}`} value={`${i.exam}|${i.year}`}>{i.exam} — {n(i.year).replace(/[,،]/g, "")}</option>)}</select>}</label>
        </div>}
        {items && items.length === 0 && <p className="text-slate-500">{x("এখনো কোনো ফলাফল নেই")}</p>}
        <p className="text-xs text-slate-500">{x("একসাথে বাছলে প্রতিটি নথি আলাদা পাতায় ছাপা হবে।")}</p>
        <button type="button" className="btn-primary w-full" disabled={!any} onClick={go}>{x("প্রিন্ট / PDF")}</button>
      </div>
    </Modal>
  );
}
