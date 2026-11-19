"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "./LangProvider";
import { printList } from "@/lib/listprint";

// যে পেজে নিজস্ব প্রিন্ট বাটন নেই কিন্তু তালিকা/টেবিল আছে (ফি, ছুটি, আবেদন, পেমেন্ট যাচাই, হিসাব ইত্যাদি) — সেখানে এক বাটনেই বর্তমান তালিকা A4 তে প্রিন্ট
const SKIP = /\/(print|receipt|admit|card|merit|class-all|print-list|promotion|results)(\/|$)/;
export default function PageTablePrint() {
  const { x } = useLang(); const path = usePathname(); const [show, setShow] = useState(false);
  useEffect(() => {
    const chk = () => setShow(!SKIP.test(path) && !!document.querySelector("main table tbody tr") && !document.querySelector("[data-crud]"));
    chk(); const t = setInterval(chk, 1500); return () => clearInterval(t);
  }, [path]);
  if (!show) return null;
  function go() {
    const tables = [...document.querySelectorAll("main table")].filter((t) => t.querySelector("tbody tr")); if (!tables.length) return;
    const t = tables.sort((a, b) => b.querySelectorAll("tbody tr").length - a.querySelectorAll("tbody tr").length)[0];
    const txt = (c) => (c.innerText || "").replace(/\s+/g, " ").trim();
    const heads = [...t.querySelectorAll("thead th")].map(txt); const keep = heads.map((h) => !!h);
    const rows = [...t.querySelectorAll("tbody tr")].map((r) => [...r.children].map((c, i) => (keep[i] === false ? null : c.querySelector("input,select") ? c.querySelector("input,select").value : txt(c)))).map((r) => r.filter((v) => v !== null)).filter((r) => r.some((v) => v));
    printList({ title: document.querySelector("main h1")?.innerText || x("তালিকা"), head: heads.filter(Boolean), rows, total: rows.length });
  }
  return <button onClick={go} className="btn-primary fixed bottom-5 right-5 z-30 !py-2 shadow-gilt print:hidden"><Icon name="print" className="h-4 w-4" /> {x("তালিকা প্রিন্ট")}</button>;
}
