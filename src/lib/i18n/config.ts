/**
 * i18n altyapısı (PROJE.md giriş notu).
 *
 * Bugün arayüz tamamen Türkçe. İleride oyun modülüyle Arapça/RTL devreye
 * girecek; o yüzden metinler baştan sözlükten okunur ve yön (dir) tek bir
 * yerden belirlenir. Yeni dil eklemek = LOCALES'e satır + sözlük dosyası.
 */

export const LOCALES = ["tr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tr";

/** Yazı yönü — Arapça sağdan sola. */
export const LOCALE_DIRECTION: Record<Locale, "ltr" | "rtl"> = {
  tr: "ltr",
  ar: "rtl",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function directionOf(locale: Locale): "ltr" | "rtl" {
  return LOCALE_DIRECTION[locale];
}
