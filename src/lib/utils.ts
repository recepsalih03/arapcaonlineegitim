import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sınıflarını çakışmasız birleştirir. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "12 Mart 2025, 14:30" biçiminde Türkçe tarih. */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

/** "12 Mart 2025" biçiminde Türkçe tarih. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(
    new Date(date),
  );
}

/** Saniyeyi "12:05" biçimine çevirir. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/** Günün başlangıcına (00:00 UTC) yuvarlar — anket oy zaman damgaları için. */
export function startOfDayUTC(date: Date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
