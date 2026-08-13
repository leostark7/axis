"use client";

import { useEffect, useRef } from "react";
import { useAxisStore } from "@/lib/store";

const CHECK_INTERVAL_MS = 60_000;
const REMIND_BEFORE_MIN = 15;

export default function Reminders() {
  const items = useAxisStore((s) => s.items);
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    function check() {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      for (const it of items) {
        if (!it.date || !it.time || it.done || notified.current.has(it.id)) continue;
        const when = new Date(`${it.date}T${it.time}:00`);
        const diffMin = (when.getTime() - now.getTime()) / 60_000;
        if (diffMin > 0 && diffMin <= REMIND_BEFORE_MIN) {
          notified.current.add(it.id);
          new Notification("Axis — daqui a pouco", {
            body: `${it.title} às ${it.time}`,
            icon: "/icon-192.png",
          });
        }
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [items]);

  return null;
}
