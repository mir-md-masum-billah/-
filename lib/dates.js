// সব তারিখ বাংলাদেশ সময় (Asia/Dhaka) অনুযায়ী, YYYY-MM-DD স্ট্রিং হিসেবে সংরক্ষিত
export const TZ = "Asia/Dhaka";
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export const todayDhaka = (d = new Date()) => fmt.format(d);
export const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
export const isFuture = (s) => s > todayDhaka();
export const ymDhaka = (d = new Date()) => todayDhaka(d).slice(0, 7);
export const yearDhaka = () => Number(todayDhaka().slice(0, 4));
export const monthDhaka = () => Number(todayDhaka().slice(5, 7));
// গত n মাসের "YYYY-MM" তালিকা (পুরনো → নতুন)
export function lastMonths(n) {
  const [y, m] = ymDhaka().split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const t = y * 12 + (m - 1) - i; out.push(`${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`); }
  return out;
}

export function eachDate(from, to) {
  const out = []; const d = new Date(from + "T00:00:00Z"); const end = new Date(to + "T00:00:00Z");
  while (d <= end && out.length < 400) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}
export const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export function monthRange(ym) { const [y, m] = ym.split("-").map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); return [`${ym}-01`, `${ym}-${String(last).padStart(2, "0")}`]; }
