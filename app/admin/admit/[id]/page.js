"use client";
import { use } from "react";
import AdmitCardView from "@/components/AdmitCardView";
export default function Page({ params }) { const { id } = use(params); return <AdmitCardView id={id} />; }
