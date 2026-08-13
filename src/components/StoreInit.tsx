"use client";

import { useEffect } from "react";
import { useAxisStore } from "@/lib/store";

export default function StoreInit() {
  const init = useAxisStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
}
