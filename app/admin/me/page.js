"use client";
import { useEffect } from "react";
import useMe from "@/hooks/useMe";
import Loader from "@/components/Loader";

// নিজের প্রোফাইলে পাঠায় (শিক্ষক/স্টাফ নিজের তথ্য, বেতন, রুটিন, হাজিরা, ছুটি ও কার্যকলাপ দেখেন)
export default function Page() {
  const me = useMe();
  useEffect(() => { if (me?.id) location.replace(`/admin/staff/${me.id}`); }, [me]);
  return <Loader compact label="..." />;
}
