"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Inbox, Clapperboard, Zap, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Calendário", icon: CalendarDays },
  { href: "/backlog", label: "Caixa de Ideias", icon: Inbox },
  { href: "/roteiros", label: "Roteiros", icon: Clapperboard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  return (
    <aside className="glass flex h-screen w-64 shrink-0 flex-col border-r p-4">
      <div className="mb-10 flex items-center gap-3 px-2 pt-1">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_6px_20px_-4px_rgba(37, 99, 235,0.6)]">
          <Zap size={20} className="text-white drop-shadow" />
        </div>
        <div>
          <div className="text-base font-bold leading-tight glow-text">Axis</div>
          <div className="text-[10px] uppercase tracking-widest text-[#101a2e]/40 leading-tight">
            LS Brainstorm
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-3.5 py-2.5 text-sm transition-all ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-[0_6px_16px_-4px_rgba(37, 99, 235,0.5)]"
                  : "text-[#101a2e]/60 hover:bg-[#101a2e]/[0.06] hover:text-[#101a2e]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#101a2e]/10 px-2 pt-4">
        <span className="truncate text-xs text-[#101a2e]/40" title={email ?? ""}>
          {email ?? ""}
        </span>
        <button
          onClick={handleLogout}
          title="Sair"
          className="shrink-0 rounded-lg p-1.5 text-[#101a2e]/40 transition hover:bg-[#101a2e]/10 hover:text-[#101a2e]"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
