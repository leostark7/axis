"use client";

import { usePathname } from "next/navigation";
import { useAxisStore } from "@/lib/store";

export default function LoadingBar() {
  const pathname = usePathname();
  const loading = useAxisStore((s) => s.loading);
  const loaded = useAxisStore((s) => s.loaded);

  if (pathname === "/login" || loaded || !loading) return null;

  return (
    <div className="fixed left-0 top-0 z-[60] h-0.5 w-full overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[loadingbar_1.1s_ease-in-out_infinite] bg-gradient-to-r from-blue-600 to-cyan-400" />
      <style jsx>{`
        @keyframes loadingbar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
}
