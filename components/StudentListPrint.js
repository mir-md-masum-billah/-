"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { api } from "./CrudPage";
import { useLang } from "./LangProvider";
import { printUrl } from "@/lib/print";

export const PRINT_COLS = [
  ["roll", "রোল"], ["studentId", "আইডি"], ["photo", "ছবি"], ["fatherName", "পিতার নাম"], ["motherName", "মাতার নাম"],
  ["phone", "মোবাইল"], ["guardianPhone", "অভিভাবকের মোবাইল"], ["gender", "লিঙ্গ"], ["dob", "জন্ম তারিখ"], ["address", "ঠিকানা"], ["section", "শাখা"],
];

// শ্রেণি অনুযায়ী শিক্ষার্থী তালিকা প্রিন্ট: কোন কোন কলাম, কয়টি ফাঁকা (নামসহ) কলাম, কোন শিক্ষার্থী থাকবে — সব বেছে নেওয়া যায়
export default function StudentListPrint({ cls, onClose }) {
  const { x } = useLang();
  const [list, setList] = useState(null); const [off, setOff] = useState({});
  const [cols, setCols] = useState(["roll", "studentId"]); const [blanks, setBlanks] = useState([]); const [bn, setBn] = useState("");
  useEffect(() => { api("GET", `/api/students?limit=1000&active=true${cls ? `&class=${encodeURIComponent(cls)}` : ""}`).then((r) => setList(r.ok ? r.d.items : [])); }, [cls]);
  const tog = (k) => setCols((c) => (c.includes(k) ? c.filter((i) => i !== k) : [...c, k]));
  const chosen = (list || []).filter((s) => !off[s._id]);
  function go() {
    sessionStorage.setItem("stuPrint", JSON.stringify({ cls, ids: chosen.map((s) => s._id), cols, blanks }));
    printUrl("/admin/students/print");
  }
  return (
    <Modal title={`${x("শিক্ষার্থী তালিকা প্রিন্ট")} — ${cls ? x(cls) : x("সব শিক্ষার্থী")}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div><p className="label">{x("কোন কলাম থাকবে (নাম ও ক্রম নং সবসময় থাকবে)")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">{PRINT_COLS.map(([k, l]) => <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={cols.includes(k)} onChange={() => tog(k)} />{x(l)}</label>)}</div></div>
        <div><p className="label">{x("ফাঁকা কলাম (স্বাক্ষর/নম্বর ইত্যাদির জন্য) — উপরে নাম দিন")}</p>
          <div className="flex gap-2"><input className="input" value={bn} onChange={(e) => setBn(e.target.value)} placeholder={x("কলামের নাম (যেমন: স্বাক্ষর)")} /><button type="button" className="btn-ghost !py-2" onClick={() => { setBlanks([...blanks, bn.trim()]); setBn(""); }}>{x("+ যোগ")}</button></div>
          <div className="mt-2 flex flex-wrap gap-2">{blanks.map((b, i) => <span key={i} className="rounded-full bg-brand-light px-3 py-1">{b || x("(নামহীন)")} <button type="button" className="ml-1 text-red-600" onClick={() => setBlanks(blanks.filter((_, j) => j !== i))}>×</button></span>)}</div></div>
        <div><div className="mb-1 flex items-center justify-between"><p className="label !mb-0">{x("শিক্ষার্থী বাছাই")} ({chosen.length}/{list?.length ?? 0})</p>
          <span className="space-x-3"><button type="button" className="text-brand underline" onClick={() => setOff({})}>{x("সব নিন")}</button><button type="button" className="text-brand underline" onClick={() => setOff(Object.fromEntries((list || []).map((s) => [s._id, true])))}>{x("সব বাদ")}</button></span></div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 p-2">{!list ? x("লোড হচ্ছে...") : list.map((s) => <label key={s._id} className="flex items-center gap-2 py-0.5"><input type="checkbox" checked={!off[s._id]} onChange={() => setOff({ ...off, [s._id]: !off[s._id] })} />{s.roll}. {s.name}{!cls && <span className="text-slate-500"> ({x(s.class)})</span>}</label>)}</div></div>
        <button type="button" className="btn-primary w-full" disabled={!chosen.length} onClick={go}>{x("প্রিন্ট / PDF")}</button>
      </div>
    </Modal>
  );
}
