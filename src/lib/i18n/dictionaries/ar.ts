import type { Dictionary } from "./tr";
import { tr } from "./tr";

/**
 * Arapça sözlük — oyun modülü fazına kadar iskelet.
 * Çevrilmemiş anahtarlar Türkçe karşılığına düşer, böylece eksik çeviri
 * arayüzü kırmaz.
 */
export const ar: Dictionary = {
  ...tr,
  app: {
    ...tr.app,
    name: "دروس اللغة العربية الخاصة",
  },
};
