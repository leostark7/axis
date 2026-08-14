"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "axis-install-dismissed";

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (pathname === "/login" || standalone || dismissed || !deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="glass fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl p-3 shadow-xl md:bottom-6 md:left-6 md:translate-x-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <Download size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-[#101a2e]">Instalar o Axis</div>
        <div className="text-[11px] text-[#101a2e]/50">Acesso rápido como app, sem abrir o navegador.</div>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white"
      >
        Instalar
      </button>
      <button onClick={dismiss} className="shrink-0 text-[#101a2e]/40 hover:text-[#101a2e]">
        <X size={15} />
      </button>
    </div>
  );
}

export function InstalledBadge() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }, []);

  if (!standalone) return null;

  return (
    <span
      title="Rodando como app instalado"
      className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
    >
      <CheckCircle2 size={10} />
      App
    </span>
  );
}
