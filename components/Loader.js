import Crest from "./Crest";

// ভেতরের লোডিং: স্কুলের প্রতীকটি নিজের অক্ষে ঘোরে, চারদিকে সোনালি বলয় ঘোরে
export default function Loader({ label = "", className = "" }) {
  return (
    <div role="status" className={`flex flex-col items-center gap-5 ${className}`}>
      <div className="loader">
        <svg viewBox="0 0 100 100" className="loader-ring" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeOpacity=".18" strokeWidth="1.5" />
          <path d="M50 4a46 46 0 0 1 46 46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <Crest className="loader-crest" />
      </div>
      {label && <p className="font-display text-lg text-brand-dark">{label}</p>}
    </div>
  );
}
