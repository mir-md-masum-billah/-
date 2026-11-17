"use client";
import { use } from "react";
import ReceiptView from "@/components/ReceiptView";

export default function Receipt({ params }) {
  const { id } = use(params);
  return <div className="min-h-screen bg-pearl p-4 sm:p-8 print:min-h-0 print:bg-white print:p-0"><ReceiptView id={id} /></div>;
}
