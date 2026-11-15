"use client";
import { useEffect, useState } from "react";
import { api, Pager } from "@/components/CrudPage";
import { useLang } from "@/components/LangProvider";

export default function Audit() {
  const { lang, x } = useLang();
  const [d, setD] = useState({ items: [], total: 0, pages: 1 }); const [page, setPage] = useState(1); const [q, setQ] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { api("GET", `/api/audit?page=${page}&q=${encodeURIComponent(q)}`).then((r) => (r.ok ? setD(r.d) : setErr(r.d.error))); }, [page, q]);
  return (
    <div>
      <div className="mb-4 flex gap-3"><h1 className="mr-auto text-3xl text-brand-dark">{x("অডিট লগ")}</h1><input className="input !w-52" placeholder={x("ব্যবহারকারী/কাজ")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      {err && <p className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      <div className="card overflow-x-auto !p-0"><table className="w-full min-w-[600px]"><thead><tr>{["সময়", "ব্যবহারকারী", "কাজ", "বিষয়", "বিবরণ"].map((h) => <th key={h} className="th">{x(h)}</th>)}</tr></thead>
        <tbody>{d.items.map((a) => <tr key={a._id}><td className="td whitespace-nowrap">{new Date(a.createdAt).toLocaleString(lang === "en" ? "en-GB" : "bn-BD", { timeZone: "Asia/Dhaka" })}</td><td className="td">{a.userName}</td><td className="td">{a.action}</td><td className="td">{a.entity}</td>
          <td className="td max-w-xs truncate text-xs text-slate-600" title={JSON.stringify(a.details)}>{a.details?.receiptNo || a.details?.invoiceNo || a.details?.title || a.details?.name || a.details?.reason || JSON.stringify(a.details || {}).slice(0, 60)}</td></tr>)}</tbody></table></div>
      <Pager page={page} pages={d.pages} total={d.total} setPage={setPage} />
    </div>
  );
}
