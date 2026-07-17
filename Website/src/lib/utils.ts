import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | { toNumber(): number }): string {
  const num = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function formatDate(date: Date | string, locale: string = "es"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateOrderNumber(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `CF-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Returns true if current time is within the last-hour sale window
// Window: 60 min before closing, cutoff: 10 min before closing
export function isLastHourSaleActive(closingTime: string): boolean {
  const now = new Date();
  const [closingHour, closingMin] = closingTime.split(":").map(Number);

  const closing = new Date();
  closing.setHours(closingHour, closingMin, 0, 0);

  const windowStart = new Date(closing.getTime() - 60 * 60 * 1000);
  const cutoff = new Date(closing.getTime() - 10 * 60 * 1000);

  return now >= windowStart && now <= cutoff;
}

export function getLastHourCutoff(closingTime: string): Date {
  const [closingHour, closingMin] = closingTime.split(":").map(Number);
  const closing = new Date();
  closing.setHours(closingHour, closingMin, 0, 0);
  return new Date(closing.getTime() - 10 * 60 * 1000);
}
