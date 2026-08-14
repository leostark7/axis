"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, CalendarDays, Inbox, Clapperboard, ClipboardList, Building2, BarChart3, History, Zap, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { InstalledBadge } from "./InstallPrompt";
import SemanticSearch from "./SemanticSearch";
import PushSubscribeButton from "./PushSubscribeButton";

const NAV = [
  { href: "/", label: "Hoje", icon: Sun },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/backlog", label: "Caixa de Ideias", icon: Inbox },
  { href: "/roteiros", label: "Roteiros", icon: Clapperboard },
  { href: "/demandas", label: "Demandas", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/metricas", label: "Métricas", icon: BarChart3 },
  { href: "/atividade", label: "Atividade", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  return (
    <>
      <div className="glass sticky top-0 z-30 flex items-center justify-between p-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold glow-text">Axis</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-[#101a2e]/70 hover:bg-[#101a2e]/10"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#101a2e]/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`glass fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r p-4 transition-transform duration-200 md:static md:z-auto md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_6px_20px_-4px_rgba(37,99,235,0.6)]">
              <Zap size={20} className="text-white drop-shadow" />
            </div>
            <div>
              <div className="text-base font-bold leading-tight glow-text">Axis</div>
              <div className="text-[10px] uppercase tracking-widest text-[#101a2e]/60 leading-tight">
                LS Brainstorm
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-[#101a2e]/50 hover:bg-[#101a2e]/10 md:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-2">
          <SemanticSearch />
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
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)]"
                    : "text-[#101a2e]/60 hover:bg-[#101a2e]/[0.06] hover:text-[#101a2e]"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-[#101a2e]/10 pt-4">
          <PushSubscribeButton />
        </div>
        <div className="flex items-center justify-between gap-2 px-2 pt-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs text-[#101a2e]/60" title={email ?? ""}>
              {email ?? ""}
            </span>
            <InstalledBadge />
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="shrink-0 rounded-lg p-1.5 text-[#101a2e]/60 transition hover:bg-[#101a2e]/10 hover:text-[#101a2e]"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  );
}
