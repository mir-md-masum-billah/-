"use client";
import { useEffect, useState } from "react";
import useMe from "@/hooks/useMe";
import { api, Toast } from "@/components/CrudPage";
import { todayDhaka } from "@/lib/dates";
import { useLang } from "@/components/LangProvider";

const ST = [["present", "উপস্থিত", "bg-brand text-white"], ["absent", "অনুপস্থিত", "bg-red-600 text-white"], ["late", "দেরি", "bg-gold text-ink"], ["leave", "ছুটি", "bg-slate-600 text-white"], ["holiday", "হলিডে", "bg-sky-600 text-white"]];
export default function StaffAttendance() {
  const me = useMe(); const { x } = useLang(); const [date, setDate] = useState(todayDhaka());
  const [list, setList] = useState([]); const [saved, setSaved] = useState({}); const [status, setStatus] = useState({}); const [err, setErr] = useState(""); const [toast, setToast] = useState(""); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      const [u, a, l] = await Promise.all([api("GET", "/api/staff?active=true&limit=300"), api("GET", `/api/staff-attendance?date=${date}&limit=500`), api("GET", `/api/leaves/active?kind=staff&date=${date}`)]);
      if (!u.ok || !a.ok) { setErr(u.d.error || a.d.error || x("লোড করা যায়নি")); setLoading(false); return; }
      const done = {}; a.d.items.forEach((x) => (done[x.user?._id] = x.status));
      const init = { ...done }; (l.d.ids || []).forEach((id) => { if (!init[id]) init[id] = "leave"; }); // অনুমোদিত ছুটি আগে থেকে দেখায় (সংরক্ষণ করলে তবেই রেকর্ড হয়)
      setList(u.d.items); setSaved(done); setStatus(init); setLoading(false);
    })();
  }, [date]);
  const marked = list.filter((s) => status[s._id]).length, unmarked = list.length - marked;
  async function save() {
    if (unmarked && !confirm(x("{0} জন অচিহ্নিত থাকবে। এগিয়ে যাবেন?", unmarked))) return;
    setBusy(true); const r = await api("POST", "/api/staff-attendance/bulk", { date, records: list.filter((s) => status[s._id]).map((s) => ({ user: s._id, status: status[s._id] })) }); setBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সংরক্ষণ ব্যর্থ")); setErr(""); setSaved({ ...status }); setToast(x("✅ নতুন {0}, সংশোধন {1}", r.d.created, r.d.corrected)); setTimeout(() => setToast(""), 3000);
  }
  if (!me) return <p>{x("লোড হচ্ছে...")}</p>;
  const w = me.perms.includes("staffattendance.write");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{x("স্টাফ হাজিরা")}</h1>
      <div className="mb-3 flex flex-wrap gap-3"><input type="date" className="input !w-auto" value={date} max={todayDhaka()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={x("তারিখ")} />
        {w && <button className="btn-ghost" onClick={() => setStatus((p) => { const n = { ...p }; list.forEach((s) => { if (!n[s._id]) n[s._id] = "present"; }); return n; })}>{x("অচিহ্নিত সবাইকে উপস্থিত করুন")}</button>}</div>
      <p className="mb-3 text-sm">{x("অচিহ্নিত:")} <b className={unmarked ? "text-red-600" : ""}>{x("{0} জন", unmarked)}</b></p>
      {err && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {loading ? <p>{x("লোড হচ্ছে...")}</p> : <div className="space-y-2">{list.map((s) => (
        <div key={s._id} className={`card flex flex-wrap items-center justify-between gap-2 !p-3 ${!status[s._id] ? "border-dashed !border-red-300" : ""}`}>
          <p className="font-semibold">{s.name} <span className="text-sm font-normal text-slate-500">{s.designation || s.subject || ""}</span>{!status[s._id] && <span className="ml-2 text-xs font-normal text-red-600">{x("অচিহ্নিত")}</span>}{status[s._id] === "leave" && !saved[s._id] && <span className="ml-2 text-xs font-normal text-sky-700">{x("(অনুমোদিত ছুটি)")}</span>}</p>
          <div className="flex flex-wrap gap-1.5">{ST.map(([k, l, c]) => <button key={k} disabled={!w} onClick={() => setStatus({ ...status, [s._id]: k })} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status[s._id] === k ? c : "bg-slate-100 text-slate-700"}`}>{x(l)}</button>)}</div></div>))}</div>}
      {w && list.length > 0 && <div className="sticky bottom-3 mt-4"><button className="btn-primary" disabled={busy || marked === 0} onClick={save}>{busy ? x("সংরক্ষণ হচ্ছে...") : x("হাজিরা সংরক্ষণ করুন ({0} জন)", marked)}</button></div>}
      <Toast msg={toast} />
    </div>
  );
}
