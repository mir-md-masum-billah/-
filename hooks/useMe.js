"use client";
import { useEffect, useState } from "react";
export default function useMe() {
  const [me, setMe] = useState(null);
  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => {}); }, []);
  return me;
}
