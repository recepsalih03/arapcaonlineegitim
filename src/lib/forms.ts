import { GRADES, type Grade, isGrade } from "@/lib/constants";

/** Server action'ların ortak dönüş tipi (useActionState ile kullanılır). */
export type ActionState = {
  error?: string;
  success?: string;
  /** Öğrenci oluşturma gibi tek seferlik gösterilecek veriler. */
  data?: Record<string, string>;
};

export const EMPTY_ACTION_STATE: ActionState = {};

/** Çoklu sınıf seçimini FormData'dan güvenli biçimde okur. */
export function readGrades(formData: FormData, field = "grades"): Grade[] {
  const values = formData
    .getAll(field)
    .map((value) => Number.parseInt(String(value), 10))
    .filter(isGrade);
  // Tekrarları at, sırayı sabitle.
  return GRADES.filter((grade) => values.includes(grade));
}

export function readText(formData: FormData, field: string): string {
  return String(formData.get(field) ?? "").trim();
}

export function readOptionalText(formData: FormData, field: string): string | null {
  const value = readText(formData, field);
  return value === "" ? null : value;
}

export function readBoolean(formData: FormData, field: string): boolean {
  const value = formData.get(field);
  return value === "on" || value === "true" || value === "1";
}

/**
 * `<input type="datetime-local">` değerini Date'e çevirir.
 *
 * Tarayıcı "2026-09-15T14:30" gibi, saat dilimi TAŞIMAYAN bir metin gönderir;
 * new Date(...) bunu sunucunun yerel saatine göre yorumlar. Vercel UTC'de
 * çalıştığı için öğretmenin girdiği saat 3 saat kayardı. Bu yüzden değeri
 * Türkiye saati (UTC+3) kabul edip UTC'ye çeviriyoruz.
 */
const TURKIYE_UTC_FARKI_DAKIKA = 180;

export function readDateTime(formData: FormData, field: string): Date | null {
  const raw = readText(formData, field);
  if (!raw) return null;

  const eslesme = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!eslesme) return null;

  const [, yil, ay, gun, saat, dakika] = eslesme;
  const zaman = Date.UTC(
    Number(yil),
    Number(ay) - 1,
    Number(gun),
    Number(saat),
    Number(dakika),
  );
  const tarih = new Date(zaman - TURKIYE_UTC_FARKI_DAKIKA * 60_000);
  return Number.isNaN(tarih.getTime()) ? null : tarih;
}

/** Date'i `<input type="datetime-local">` değerine çevirir (Türkiye saati). */
export function toDateTimeLocal(date: Date | null | undefined): string {
  if (!date) return "";
  const kayik = new Date(date.getTime() + TURKIYE_UTC_FARKI_DAKIKA * 60_000);
  return kayik.toISOString().slice(0, 16);
}
