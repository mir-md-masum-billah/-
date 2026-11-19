"use client";
import { use } from "react";
import StudentPrintPage from "@/components/StudentPrintPage";

export default function Page({ params }) { const { id } = use(params); return <StudentPrintPage admin id={id} />; }
