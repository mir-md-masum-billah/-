"use client";
import { useEffect, useState } from "react";
let cache = null;
export default function useSchool() {
  const [s, setS] = useState(cache);
  useEffect(() => { fetch("/api/public/school").then((r) => r.json()).then((j) => { cache = j; setS(j); }).catch(() => {}); }, []);
  return s;
}
