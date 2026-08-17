"use client";

import { useEffect } from "react";
import { useAxisStore } from "@/lib/store";
import { useThemeStore } from "@/lib/themeStore";

export default function StoreInit() {
  const init = useAxisStore((s) => s.init);
  const initTheme = useThemeStore((s) => s.init);
  useEffect(() => {
    init();
    initTheme();
  }, [init, initTheme]);
  return null;
}
