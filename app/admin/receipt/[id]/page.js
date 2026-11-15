"use client";
import { use } from "react";
import ReceiptView from "@/components/ReceiptView";

export default function Receipt({ params }) {
  const { id } = use(params);
  return <ReceiptView id={id} />;
}
