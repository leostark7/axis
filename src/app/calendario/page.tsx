"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAxisStore } from "@/lib/store";
import ItemChip from "@/components/ItemChip";
import QuickAdd from "@/components/QuickAdd";
import StatsDashboard from "@/components/StatsDashboard";
import DayModal from "@/components/DayModal";
import CategoryFilterToggle from "@/components/CategoryFilterToggle";
import { useCategoryFilterStore } from "@/lib/categoryFilterStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "month" | "week";
const MONTH_CELL_LIMIT = 3;

export default function CalendarPage() {
  const allItems = useAxisStore((s) => s.items);
  const scheduleItem = useAxisStore((s) => s.scheduleItem);
  const categoryFilter = useCategoryFilterStore((s) => s.filter);
  const items =
    categoryFilter === "ambos" ? allItems : allItems.filter((it) => (it.category ?? "empresarial") === categoryFilter);
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const days = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(cursor, { weekStartsOn: 0 }),
        end: endOfWeek(cursor, { weekStartsOn: 0 }),
      });
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor, view]);

  const backlog = items.filter((it) => !it.date);

  function itemsForDay(day: Date) {
    return items.filter((it) => it.date && isSameDay(new Date(it.date + "T00:00:00"), day));
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) scheduleItem(id, format(day, "yyyy-MM-dd"));
  }

  function goPrev() {
    setCursor(view === "week" ? subWeeks(cursor, 1) : subMonths(cursor, 1));
  }

  function goNext() {
    setCursor(view === "week" ? addWeeks(cursor, 1) : addMonths(cursor, 1));
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold capitalize glow-text md:text-2xl">
            {view === "week"
              ? `Semana de ${format(startOfWeek(cursor, { weekStartsOn: 0 }), "d MMM", { locale: ptBR })}`
              : format(cursor, "MMMM yyyy", { locale: ptBR })}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryFilterToggle />
            <div className="glass flex items-center gap-1 rounded-xl p-1">
              <button
                onClick={() => setView("month")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  view === "month"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "text-[#101a2e]/60 hover:bg-[#101a2e]/10"
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setView("week")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  view === "week"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "text-[#101a2e]/60 hover:bg-[#101a2e]/10"
                }`}
              >
                Semana
              </button>
            </div>
            <div className="glass flex items-center gap-1 rounded-xl p-1">
              <button
                onClick={goPrev}
                className="rounded-lg p-1.5 text-[#101a2e]/60 hover:bg-[#101a2e]/10 hover:text-[#101a2e]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#101a2e]/70 hover:bg-[#101a2e]/10 hover:text-[#101a2e]"
              >
                Hoje
              </button>
              <button
                onClick={goNext}
                className="rounded-lg p-1.5 text-[#101a2e]/60 hover:bg-[#101a2e]/10 hover:text-[#101a2e]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <QuickAdd />
        </div>

        <div className="glass grid grid-cols-7 gap-px overflow-hidden rounded-t-2xl text-xs font-semibold text-[#101a2e]/45">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="px-2 py-2 text-center uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div
          className={`glass grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-b-2xl border-t-0 ${
            view === "week" ? "grid-rows-1" : ""
          }`}
        >
          {days.map((day) => {
            const dayItems = itemsForDay(day);
            const today = isToday(day);
            const capped = view === "month" ? dayItems.slice(0, MONTH_CELL_LIMIT) : dayItems;
            const hiddenCount = dayItems.length - capped.length;
            return (
              <div
                key={day.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => view === "month" && setSelectedDay(day)}
                className={`flex flex-col gap-1 p-1.5 transition-colors ${
                  view === "week" ? "min-h-[420px]" : "min-h-[92px] active:bg-blue-600/[0.05]"
                } ${today ? "bg-blue-600/[0.07]" : ""} ${
                  view === "month" && !isSameMonth(day, cursor) ? "opacity-35" : ""
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    today
                      ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_4px_10px_-2px_rgba(37,99,235,0.6)]"
                      : "text-[#101a2e]/50"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-1 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  {capped.map((it) => (
                    <ItemChip key={it.id} item={it} onUnschedule={() => scheduleItem(it.id, null)} />
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDay(day);
                      }}
                      className="rounded-md bg-[#101a2e]/5 px-1.5 py-1 text-left text-[10px] font-semibold text-[#101a2e]/50 hover:bg-[#101a2e]/10"
                    >
                      +{hiddenCount} mais
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <StatsDashboard />
        </div>
      </div>

      {selectedDay && (
        <DayModal day={selectedDay} items={itemsForDay(selectedDay)} onClose={() => setSelectedDay(null)} />
      )}

      <div className="glass hidden w-72 shrink-0 flex-col gap-2 border-l p-4 md:flex">
        <h2 className="text-sm font-bold text-[#101a2e]/80">✨ Caixa de Ideias</h2>
        <p className="text-xs text-[#101a2e]/60">Arraste para um dia do calendário.</p>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {backlog.length === 0 && (
            <p className="text-xs text-[#101a2e]/50">Nada solto por aqui. Use a captura rápida.</p>
          )}
          {backlog.map((it) => (
            <div
              key={it.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", it.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              <ItemChip item={it} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
