// স্কুলের প্রতীক: তোরণ + আট কোণা তারা। রং আসে টেক্সট-রঙ (currentColor) থেকে।
export default function Crest({ className = "h-10 w-auto" }) {
  return (
    <svg viewBox="0 0 48 62" className={className} fill="none" aria-hidden="true">
      <path d="M4 58V26C4 13.3 12.9 4 24 4s20 9.3 20 22v32" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 58V26c0-9.9 6-18 14-18s14 8.1 14 18v32" stroke="currentColor" strokeOpacity=".5" strokeWidth="1" />
      <g transform="translate(24 32)" stroke="currentColor" strokeWidth="1.4">
        <rect x="-7" y="-7" width="14" height="14" />
        <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
      </g>
      <path d="M1 58h46" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
