"use client";

import { useEffect, useRef, useState } from "react";
import { TOAST_EVENT, type ToastTone } from "@/lib/toast";

type ToastItem = { id: number; message: string; tone: ToastTone };
type ToastDetail = { message: string; tone: ToastTone; duration: number };

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  function clearTimer(id: number) {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
  }

  function dismiss(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
    clearTimer(id);
  }

  useEffect(() => {
    const activeTimers = timers.current;
    const receive = (event: Event) => {
      const { message, tone, duration } = (event as CustomEvent<ToastDetail>).detail;
      if (!message?.trim()) return;
      const id = ++nextId.current;
      setItems((current) => {
        const kept = current.slice(-2);
        for (const item of current) {
          if (!kept.some((keptItem) => keptItem.id === item.id)) {
            const timer = activeTimers.get(item.id);
            if (timer !== undefined) window.clearTimeout(timer);
            activeTimers.delete(item.id);
          }
        }
        return [...kept, { id, message, tone }];
      });
      activeTimers.set(id, window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
        activeTimers.delete(id);
      }, Math.max(1000, duration)));
    };
    window.addEventListener(TOAST_EVENT, receive);
    return () => {
      window.removeEventListener(TOAST_EVENT, receive);
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <div
      className="toast-viewport"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`duo-toast toast-${item.tone}`}
          role={item.tone === "error" ? "alert" : "status"}
          aria-atomic="true"
        >
          <span className="toast-icon" aria-hidden>
            {item.tone === "success" ? "✓" : item.tone === "error" ? "!" : "🦉"}
          </span>
          <span className="toast-message">{item.message}</span>
          <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
