"use client";
import { useEffect, useState } from "react";
export default function useSettings() {
  const [s, setS] = useState(null);
  useEffect(() => { fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then(setS); }, []);
  return s;
}
