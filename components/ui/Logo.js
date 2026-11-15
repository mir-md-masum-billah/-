// স্কুলের প্রতীক: খিলান (বারান্দা/দরজা) + ভোরের সূর্য + খোলা বই — "আলোকিত মানুষ গড়ার প্রতিষ্ঠান"
// tone="brand": সবুজ খিলান (হালকা জমিনে) · tone="light": সাদাটে খিলান (গাঢ় জমিনে)
export default function Logo({ size = 44, tone = "brand", className = "" }) {
  const arch = tone === "light" ? "rgb(255 255 255 / .14)" : "rgb(var(--brand))";
  const line = tone === "light" ? "rgb(255 255 255 / .55)" : "rgb(255 255 255 / .35)";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M6 44V22C6 11 14 3 24 3s18 8 18 19v22z" fill={arch} />
      <path d="M10.5 44V22c0-8.6 5.7-15 13.5-15s13.5 6.4 13.5 15v22" stroke={line} strokeWidth="1.2" />
      <path d="M17 31a7 7 0 0 1 14 0z" fill="#F2A931" />
      <path d="M24 18.5v3M15.8 21.8l2 2M32.2 21.8l-2 2M12.6 30h2.4M33 30h2.4" stroke="#F2A931" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 38c4.2-2 8.4-1.8 13.5.8 5.1-2.6 9.3-2.8 13.5-.8v5.2c-4.2-1.8-8.4-1.6-13.5 1-5.1-2.6-9.3-2.8-13.5-1z" fill="#fff" />
    </svg>
  );
}
