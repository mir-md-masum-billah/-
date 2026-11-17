"use client";
// পেজ না খুলে সরাসরি প্রিন্ট: নথিটি অদৃশ্য ফ্রেমে লোড হয়, লোড শেষে প্রিন্ট ডায়ালগ খোলে (সেখানেই "Save as PDF")।
export function printUrl(url) {
  const f = document.createElement("iframe");
  f.src = url + (url.includes("?") ? "&" : "?") + "print=1";
  f.setAttribute("aria-hidden", "true");
  Object.assign(f.style, { position: "fixed", left: "-10000px", top: "0", width: "820px", height: "1200px", border: "0", opacity: "0", pointerEvents: "none" });
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 120000);
}
