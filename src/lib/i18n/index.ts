import { DEFAULT_LOCALE, directionOf, type Locale } from "./config";
import { ar } from "./dictionaries/ar";
import { tr, type Dictionary } from "./dictionaries/tr";

const DICTIONARIES: Record<Locale, Dictionary> = { tr, ar };

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return DICTIONARIES[locale] ?? tr;
}

/**
 * "{max} cihaz" gibi yer tutuculu metinleri doldurur.
 * t(d.auth.deviceLimitReached, { max: 4 })
 */
export function t(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export { DEFAULT_LOCALE, directionOf, type Locale };
export type { Dictionary };
