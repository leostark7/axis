import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import StoreInit from "@/components/StoreInit";
import PwaRegister from "@/components/PwaRegister";
import GlobalQuickAdd from "@/components/GlobalQuickAdd";
import Reminders from "@/components/Reminders";
import InstallPrompt from "@/components/InstallPrompt";
import AxisChat from "@/components/AxisChat";
import LoadingBar from "@/components/LoadingBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axis — by LS Brainstorm",
  description: "A agenda inteligente que dá ritmo às suas ideias, roteiros e compromissos.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Axis",
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[#101a2e] md:flex-row">
        <div className="axis-bg" />
        <LoadingBar />
        <StoreInit />
        <PwaRegister />
        <Reminders />
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <GlobalQuickAdd />
        <InstallPrompt />
        <AxisChat />
      </body>
    </html>
  );
}
