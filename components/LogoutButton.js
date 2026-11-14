"use client";
export default function LogoutButton({ className = "btn-ghost" }) {
  return (
    <button className={className} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>
      লগআউট
    </button>
  );
}
