// সহজ CSV পার্সার (উদ্ধৃতি চিহ্ন, কমা ও নতুন লাইন সহ) — ক্লায়েন্ট-সেফ
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const clean = rows.filter((r) => r.some((x) => x.trim() !== ""));
  if (!clean.length) return [];
  const head = clean[0].map((h) => h.trim());
  return clean.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim().replace(/^'(?=[=+\-@])/, "")])));
}
export const toCSV = (rows, cols) => "\uFEFF" + [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
export function download(name, text, type = "text/csv;charset=utf-8") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
