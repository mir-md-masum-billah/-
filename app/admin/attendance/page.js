"use client";
import { useEffect, useState } from "react";
import useSettings from "@/hooks/useSettings";
import useMe from "@/hooks/useMe";
import { api, Toast } from "@/components/CrudPage";
import { todayDhaka } from "@/lib/dates";
import { useLang } from "@/components/LangProvider";

const ST = [["present", "উপস্থিত", "bg-brand text-white"], ["absent", "অনুপস্থিত", "bg-red-600 text-white"], ["late", "দেরি", "bg-gold text-ink"], ["leave", "ছুটি", "bg-slate-600 text-white"], ["holiday", "হলিডে", "bg-sky-600 text-white"]];

export default function Attendance() {
  const st = useSettings(); const me = useMe(); const { x, n } = useLang();
  const [cls, setCls] = useState(""); const [section, setSection] = useState(""); const [leaveIds, setLeaveIds] = useState([]); const [date, setDate] = useState(todayDhaka());
  const [list, setList] = useState([]); const [saved, setSaved] = useState({}); const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false); const [err, setErr] = useState(""); const [toast, setToast] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => { if (st && !cls) setCls(st.classes[0]?.name || ""); }, [st, cls]);
  useEffect(() => {
    if (!cls) return;
    (async () => {
      setLoading(true); setErr("");
      const [s, a, l] = await Promise.all([api("GET", `/api/students?class=${encodeURIComponent(cls)}&active=true&limit=500`), api("GET", `/api/attendance?class=${encodeURIComponent(cls)}&date=${date}&limit=1000`), api("GET", `/api/leaves/active?kind=student&class=${encodeURIComponent(cls)}&date=${date}`)]);
      if (!s.ok || !a.ok) { setErr((s.d.error || a.d.error) || x("লোড করা যায়নি")); setLoading(false); return; }
      const done = {}; a.d.items.forEach((x) => (done[x.student?._id] = x.status));
      const init = { ...done }; const lv = l.ok ? l.d.ids : []; lv.forEach((id) => { if (!init[id]) init[id] = "leave"; }); // অনুমোদিত ছুটি আগে থেকে দেখায়, সংরক্ষণ করলে তবেই রেকর্ড হয়
      setLeaveIds(lv); setList(s.d.items); setSaved(done); setStatus(init); setLoading(false); // অচিহ্নিত = কোনো স্ট্যাটাস নেই
    })();
  }, [cls, date]);
  const view = section ? list.filter((s) => (s.section || "") === section) : list;

  const marked = view.filter((s) => status[s._id]).length, unmarked = view.length - marked;
  const changed = view.filter((s) => status[s._id] && status[s._id] !== saved[s._id]).length;
  const count = (k) => view.filter((s) => status[s._id] === k).length;
  const markAll = (k) => setStatus((p) => { const n = { ...p }; view.forEach((s) => { if (!n[s._id]) n[s._id] = k; }); return n; }); // শুধু অচিহ্নিতদের

  async function save() {
    if (unmarked && !confirm(x("{0} জন অচিহ্নিত থাকবে (হাজিরা সংরক্ষিত হবে না)। এগিয়ে যাবেন?", unmarked))) return;
    setBusy(true);
    const records = view.filter((s) => status[s._id]).map((s) => ({ student: s._id, status: status[s._id] }));
    const r = await api("POST", "/api/attendance/bulk", { date, class: cls, section: section || undefined, records });
    setBusy(false);
    if (!r.ok) return setErr(r.d.error || x("সংরক্ষণ ব্যর্থ"));
    setErr(""); setSaved({ ...status }); setToast(x("✅ নতুন {0}, সংশোধন {1}, অপরিবর্তিত {2}", r.d.created, r.d.corrected, r.d.unchanged)); setTimeout(() => setToast(""), 3000);
  }
  if (!st || !me) return <p>{x("লোড হচ্ছে...")}</p>;
  const canWrite = me.perms.includes("attendance.write");
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{x("হাজিরা")}</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input !w-auto" value={cls} onChange={(e) => setCls(e.target.value)} aria-label={x("শ্রেণি")}>{st.classes.map((c) => <option key={c.name} value={c.name}>{x(c.name)}</option>)}</select>
        {(st.classes.find((c) => c.name === cls)?.sections || []).length > 0 && <select className="input !w-auto" value={section} onChange={(e) => setSection(e.target.value)} aria-label={x("শাখা")}><option value="">{x("সব শাখা")}</option>{st.classes.find((c) => c.name === cls).sections.map((sc) => <option key={sc}>{sc}</option>)}</select>}
        <input type="date" className="input !w-auto" value={date} max={todayDhaka()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label={x("তারিখ")} />
        {canWrite && <><button className="btn-ghost" onClick={() => markAll("present")}>{x("অচিহ্নিত সবাইকে উপস্থিত করুন")}</button><button className="btn-ghost" onClick={() => markAll("holiday")}>{x("অচিহ্নিত সবাইকে হলিডে করুন")}</button></>}
      </div>
      <p className="mb-3 text-sm text-slate-700">{x("উপস্থিত {0} · অনুপস্থিত {1} · দেরি {2} · ছুটি {3} · হলিডে {4} ·", count("present"), count("absent"), count("late"), count("leave"), count("holiday"))} <b className={unmarked ? "text-red-600" : ""}>{x("অচিহ্নিত {0}", unmarked)}</b></p>
      {err && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-red-700">{err}</p>}
      {loading ? <p>{x("লোড হচ্ছে...")}</p> : (
        <div className="space-y-2">
          {view.length === 0 && <p className="card text-slate-500">{x("এই শ্রেণিতে কোনো সক্রিয় শিক্ষার্থী নেই।")}</p>}
          {view.map((s) => (
            <div key={s._id} className={`card flex flex-wrap items-center justify-between gap-2 !p-3 ${!status[s._id] ? "border-dashed !border-red-300" : ""}`}>
              <p className="font-semibold">{n(s.roll)}. {s.name} {!status[s._id] && <span className="ml-1 text-xs font-normal text-red-600">{x("অচিহ্নিত")}</span>}{status[s._id] === "leave" && !saved[s._id] && leaveIds.includes(s._id) && <span className="ml-1 text-xs font-normal text-sky-700">{x("(অনুমোদিত ছুটি)")}</span>}{saved[s._id] && status[s._id] !== saved[s._id] && <span className="ml-1 text-xs font-normal text-amber-700">{x("(সংশোধন হবে)")}</span>}</p>
              <div className="flex flex-wrap gap-1.5">
                {ST.map(([k, l, c]) => <button key={k} disabled={!canWrite} onClick={() => setStatus({ ...status, [s._id]: k })} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status[s._id] === k ? c : "bg-slate-100 text-slate-700"}`}>{x(l)}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {canWrite && view.length > 0 && <div className="sticky bottom-3 mt-4"><button className="btn-primary" onClick={save} disabled={busy || marked === 0}>{busy ? x("সংরক্ষণ হচ্ছে...") : changed ? x("হাজিরা সংরক্ষণ করুন ({0} জন, {1} টি নতুন/পরিবর্তন)", marked, changed) : x("হাজিরা সংরক্ষণ করুন ({0} জন)", marked)}</button></div>}
      <Toast msg={toast} />
    </div>
  );
}
