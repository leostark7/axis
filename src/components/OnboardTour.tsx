"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useOnboardStore, TOUR_STEPS } from "@/lib/onboardStore";

export default function OnboardTour() {
  const isActive = useOnboardStore((s) => s.isActive);
  const stepIndex = useOnboardStore((s) => s.stepIndex);
  const next = useOnboardStore((s) => s.next);
  const prev = useOnboardStore((s) => s.prev);
  const stop = useOnboardStore((s) => s.stop);
  const checkFirstVisit = useOnboardStore((s) => s.checkFirstVisit);
  const router = useRouter();
  const pathname = usePathname();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (pathname !== "/login") {
      const t = setTimeout(() => checkFirstVisit(), 1200);
      return () => clearTimeout(t);
    }
  }, [pathname, checkFirstVisit]);

  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isActive || !step) return;
    if (step.path && step.path !== pathname) {
      router.push(step.path);
    }
  }, [isActive, step, pathname, router]);

  useEffect(() => {
    if (!isActive || !step) return;
    setRect(null);
    let raf = 0;
    let tries = 0;
    function locate() {
      const el = document.querySelector(step.selector);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(() => setRect(el.getBoundingClientRect()), 250);
      } else if (tries < 20) {
        tries++;
        raf = requestAnimationFrame(locate);
      }
    }
    const t = setTimeout(locate, 150);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [isActive, step, pathname]);

  if (!isActive || !step) return null;

  const cardTop = rect ? Math.min(rect.bottom + 14, window.innerHeight - 200) : window.innerHeight / 2 - 80;
  const cardLeft = rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - 336) : window.innerWidth / 2 - 160;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-[#101a2e]/55 backdrop-blur-[1px]" onClick={stop} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-4 ring-cyan-400 shadow-[0_0_0_9999px_rgba(16,26,46,0.55)] transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <div
        className="glass absolute w-80 rounded-2xl p-4 shadow-2xl transition-all duration-300"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            Passo {stepIndex + 1} de {TOUR_STEPS.length}
          </span>
          <button onClick={stop} className="rounded-lg p-1 text-[#101a2e]/40 hover:bg-[#101a2e]/10">
            <X size={14} />
          </button>
        </div>
        <h3 className="mb-1 text-sm font-bold text-[#101a2e]">{step.title}</h3>
        <p className="mb-3 text-xs leading-relaxed text-[#101a2e]/70">{step.text}</p>
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#101a2e]/50 disabled:opacity-30"
          >
            <ArrowLeft size={12} />
            Voltar
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white"
          >
            {stepIndex === TOUR_STEPS.length - 1 ? "Concluir" : "Próximo"}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
