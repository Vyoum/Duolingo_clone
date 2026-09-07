export type ToastTone = "info" | "success" | "error";

export type ToastOptions = { tone?: ToastTone; duration?: number };

export const TOAST_EVENT = "duo-toast";

/** Show a global toast from any client component. */
export function showToast(message: string, options: ToastOptions = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, tone: options.tone ?? "info", duration: options.duration ?? 3600 },
  }));
}
