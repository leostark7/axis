"use client";

import { useEffect } from "react";
import { useCategoryFilterStore, CategoryFilter } from "@/lib/categoryFilterStore";
import { Briefcase, User, Layers } from "lucide-react";

const OPTIONS: { value: CategoryFilter; label: string; icon: typeof Briefcase }[] = [
  { value: "empresarial", label: "Empresarial", icon: Briefcase },
  { value: "pessoal", label: "Pessoal", icon: User },
  { value: "ambos", label: "Ambos", icon: Layers },
];

export default function CategoryFilterToggle() {
  const filter = useCategoryFilterStore((s) => s.filter);
  const setFilter = useCategoryFilterStore((s) => s.setFilter);
  const init = useCategoryFilterStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div data-tour="category-filter" className="glass flex items-center gap-1 rounded-xl p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setFilter(value)}
          title={
            value === "empresarial"
              ? "Mostra só o que é do trabalho (LS Brainstorm)"
              : value === "pessoal"
                ? "Mostra só a sua vida pessoal"
                : "Mostra tudo junto"
          }
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            filter === value ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "text-[#101a2e]/60 hover:bg-[#101a2e]/10"
          }`}
        >
          <Icon size={12} />
          {label}
        </button>
      ))}
    </div>
  );
}
