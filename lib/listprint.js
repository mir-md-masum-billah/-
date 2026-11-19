import { printUrl } from "@/lib/print";

// যেকোনো তালিকা A4 নথি হিসেবে প্রিন্ট: তথ্য sessionStorage এ রেখে /admin/print-list পেজ আইফ্রেমে খোলা হয়
export function printList({ title, head, rows, total, sub }) {
  try { sessionStorage.setItem("printList", JSON.stringify({ title, head, rows, total: total ?? rows.length, sub: sub || "", at: Date.now() })); } catch { return; }
  printUrl("/admin/print-list");
}
// React এলিমেন্ট (সেলের render ফল) থেকে শুধু লেখা বের করা; ছবি/বাটন বাদ
export function textOf(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  const el = node;
  if (el?.type === "img" || el?.type === "button" || el?.type === "input") return "";
  if (el?.props) return textOf(el.props.children);
  return "";
}
