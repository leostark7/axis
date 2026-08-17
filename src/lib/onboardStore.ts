"use client";

import { create } from "zustand";

export interface TourStep {
  selector: string;
  title: string;
  text: string;
  path?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav"]',
    title: "Bem-vindo ao Axis 👋",
    text: "Esse é o menu principal — cada ícone leva pra uma área diferente: agenda, roteiros, demandas, clientes e mais. Passe o mouse ou toque em qualquer botão da plataforma pra ver uma dica do que ele faz.",
    path: "/",
  },
  {
    selector: '[data-tour="command-palette"]',
    title: "Comandos rápidos",
    text: "Aperte Ctrl+K (ou clique aqui) a qualquer momento pra pular direto pra qualquer tela ou ação, sem precisar navegar pelo menu.",
    path: "/",
  },
  {
    selector: '[data-tour="quick-voice"]',
    title: "Toque para falar",
    text: "Fala o que precisa organizar — ideia, tarefa, compromisso ou roteiro — e a IA organiza pra você automaticamente.",
    path: "/",
  },
  {
    selector: '[data-tour="painel-link"]',
    title: "Painel Executivo",
    text: "Uma visão de 10 segundos: o que aconteceu essa semana, gargalos e previsão de entrega. Ótimo pra abrir antes de uma reunião.",
    path: "/",
  },
  {
    selector: '[data-tour="gantt-toggle"]',
    title: "Linha do tempo de demandas",
    text: "Alterne entre o quadro kanban e uma visão de linha do tempo (Gantt) das demandas por cliente.",
    path: "/demandas",
  },
  {
    selector: '[data-tour="csv-export"]',
    title: "Relatório por cliente",
    text: "Dentro da página de cada cliente tem um botão \"Gerar relatório\" — cria uma página bonita com tudo que foi entregue, pronta pra imprimir como PDF e enviar. Aqui na lista você também pode exportar tudo em CSV.",
    path: "/clientes",
  },
  {
    selector: '[data-tour="apresentacao-link"]',
    title: "Modo Apresentação",
    text: "Deixa essa tela aberta numa TV ou monitor da sala — mostra metas do mês, prazos e o ritmo da equipe em tempo real.",
    path: "/",
  },
  {
    selector: '[data-tour="theme-toggle"]',
    title: "Modo escuro",
    text: "Prefere trabalhar à noite? Alterne pro modo escuro aqui, a qualquer momento.",
    path: "/",
  },
  {
    selector: '[data-tour="help"]',
    title: "Pronto!",
    text: "Sempre que quiser rever esse tour, é só clicar aqui. Bom trabalho! 🚀",
    path: "/",
  },
];

interface OnboardState {
  isActive: boolean;
  stepIndex: number;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  checkFirstVisit: () => void;
}

export const useOnboardStore = create<OnboardState>()((set, get) => ({
  isActive: false,
  stepIndex: 0,
  start: () => set({ isActive: true, stepIndex: 0 }),
  stop: () => {
    localStorage.setItem("axis-tour-seen", "1");
    set({ isActive: false });
  },
  next: () => {
    const { stepIndex } = get();
    if (stepIndex >= TOUR_STEPS.length - 1) {
      get().stop();
      return;
    }
    set({ stepIndex: stepIndex + 1 });
  },
  prev: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  checkFirstVisit: () => {
    if (!localStorage.getItem("axis-tour-seen")) {
      set({ isActive: true, stepIndex: 0 });
    }
  },
}));
