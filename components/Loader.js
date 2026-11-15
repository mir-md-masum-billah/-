// সব লোডিংয়ের একটাই চেহারা — রিফ্রেশের স্বাগত স্ক্রিনের (Splash) মতোই:
// তোরণ সোনালি রেখায় আঁকা হয়, মাঝখানে তারা ফোটে, নিচে সোনালি বার চলতে থাকে। (ডেটা না আসা পর্যন্ত বারবার চলে)
//  <Loader compact label="…" />            → পেজ/টেবিলের ভেতরে (হালকা জমিনে)
//  <Loader full name="…" tagline="…" />    → পুরো স্ক্রিন, গাঢ় সবুজ জমিনে স্কুলের নামসহ
export default function Loader({ label = "", name = "", tagline = "", full = false, compact = false, className = "" }) {
  const body = (
    <div role="status" aria-live="polite" className={`ld ${compact ? "ld-sm" : ""} ${className}`}>
      <svg viewBox="0 0 48 62" className="ld-crest" fill="none" aria-hidden="true">
        <path className="ld-draw" pathLength="1" d="M4 58V26C4 13.3 12.9 4 24 4s20 9.3 20 22v32" stroke="currentColor" strokeWidth="1.7" />
        <path className="ld-draw" style={{ animationDelay: ".25s" }} pathLength="1" d="M10 58V26c0-9.9 6-18 14-18s14 8.1 14 18v32" stroke="currentColor" strokeOpacity=".55" strokeWidth="1" />
        <path className="ld-draw" style={{ animationDelay: ".45s" }} pathLength="1" d="M1 58h46" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <g transform="translate(24 32)">
          <g className="ld-star" stroke="currentColor" strokeWidth="1.4">
            <rect x="-7" y="-7" width="14" height="14" />
            <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
          </g>
        </g>
      </svg>
      {full && name && <h2 className="ld-name">{name}</h2>}
      {full && tagline && <p className="ld-tag">{tagline}</p>}
      <div className="ld-bar" aria-hidden="true"><span /></div>
      {label && <p className="ld-label">{label}</p>}
    </div>
  );
  if (full) return <div className="ld-full">{body}</div>;
  return compact ? <div className="grid place-items-center py-10">{body}</div> : <div className="grid min-h-[50vh] place-items-center">{body}</div>;
}
