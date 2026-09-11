/**
 * Kaba kuvvet korumasının SAF mantığı — veritabanı ve "server-only" bağımlılığı
 * yok, bu yüzden birim testten doğrudan çağrılabilir. Veritabanına dokunan
 * kısım throttle.ts içinde.
 */

/** Bu sayıya kadar hatalı deneme cezasız (yanlış yazan gerçek kullanıcı için). */
export const SERBEST_DENEME = 5;

/** Ceza eşiği aşıldıktan sonra uygulanan bekleme kademeleri (ms). */
const BEKLEME_KADEMELERI_MS = [
  30_000, // 6-10. hata: 30 sn
  2 * 60_000, // 11-15. hata: 2 dk
  10 * 60_000, // 16-20. hata: 10 dk
  60 * 60_000, // 21+ hata: 1 saat (tavan)
];

/** Kaç hatadan sonra bir üst bekleme kademesine geçilir. */
const KADEME_ADIMI = 5;

export function beklemeSuresiMs(failedCount: number): number {
  if (failedCount <= SERBEST_DENEME) return 0;
  const kademe = Math.floor((failedCount - SERBEST_DENEME - 1) / KADEME_ADIMI);
  const indeks = Math.min(kademe, BEKLEME_KADEMELERI_MS.length - 1);
  return BEKLEME_KADEMELERI_MS[indeks];
}

export type KilitDurumu =
  | { kilitli: false }
  | { kilitli: true; kalanSaniye: number };

/** lockedUntil değerine bakıp hesabın şu an kilitli olup olmadığını söyler. */
export function degerlendir(lockedUntil: Date | null): KilitDurumu {
  if (!lockedUntil) return { kilitli: false };
  const kalan = lockedUntil.getTime() - Date.now();
  if (kalan <= 0) return { kilitli: false };
  return { kilitli: true, kalanSaniye: Math.ceil(kalan / 1000) };
}
