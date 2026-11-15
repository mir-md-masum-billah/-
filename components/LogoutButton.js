"use client";
import Icon from "./Icon";
import { useLang } from "./LangProvider";
export default function LogoutButton({ className = "btn-ghost" }) {
  const { t } = useLang();
  return (
    <button className={className} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>
      <Icon name="logout" className="h-4 w-4" /> {t.shell.logout}
    </button>
  );
}
