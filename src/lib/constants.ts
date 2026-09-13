/** Platform genelinde kullanılan sabitler. */

/**
 * Sitenin üretimdeki adresi.
 *
 * Tek yerde duruyor çünkü üç yerde birden gerekiyor: sayfa metadata'sı,
 * link üretiminin yedeği ve "npm run kontrol"un R2 CORS denemesi. Alan adı
 * değişirse yalnızca burası düzeltilir.
 */
export const SITE_URL = "https://www.onlinearapcaozelders.com";

/**
 * Desteklenen sınıf seviyeleri.
 *
 * 9. sınıf sonraki fazda eklenecek; buraya bir satır eklemek yeterli — sınıf
 * listesi, panel menüsü, form seçicileri ve sayaçlar hepsi bu diziden türüyor.
 */
export const GRADES = [5, 6, 7, 8] as const;
export type Grade = (typeof GRADES)[number];

export function isGrade(value: unknown): value is Grade {
  return (
    typeof value === "number" && (GRADES as readonly number[]).includes(value)
  );
}

export function parseGrade(value: unknown): Grade | null {
  const num = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return isGrade(num) ? num : null;
}

export function gradeLabel(grade: number): string {
  return `${grade}. Sınıf`;
}

/**
 * Bir içeriğin sınıf(lar)ını tek bir rozet metnine çevirir.
 * Tek sınıf: "7. Sınıf" · birden çok: "5, 7. Sınıf".
 */
export function sinifRozeti(gradeLevels: number[]): string {
  const sirali = [...new Set(gradeLevels)].sort((a, b) => a - b);
  if (sirali.length === 0) return "";
  if (sirali.length === 1) return gradeLabel(sirali[0]);
  return `${sirali.join(", ")}. Sınıf`;
}

/**
 * Bir hesabın giriş yapabileceği en fazla fiziksel cihaz sayısı (PROJE.md §5).
 * Ortam değişkeniyle ezilebilir; ezilmezse 4.
 */
export const DEFAULT_MAX_DEVICES = 4;

/**
 * Admin hesabının cihaz limiti öğrenciden yüksek: öğretmen birden fazla cihazdan
 * (masaüstü, dizüstü, tablet, telefon...) yönetim paneline girebilsin diye.
 */
export const ADMIN_MAX_DEVICES = 6;

/**
 * Oyun modülü öğrencilere açık mı?
 *
 * true: öğrenci menüsünde "Oyunlar" görünür ve /panel/oyun adresleri açılır.
 * false: menüden kalkar, adresler 404 döner; admin oyunları hazırlayıp
 * /yonetim/oyunlar/<id>/onizle ile deneyebilir.
 */
export const OYUNLAR_OGRENCIYE_ACIK = true;

/** İmzalı R2 segment linklerinin ömrü (saniye). Kısa tutulur (PROJE.md §2b). */
export const SIGNED_SEGMENT_TTL_SECONDS = 300;

/** Presigned upload linklerinin ömrü (saniye). Büyük dosyalar için daha uzun. */
export const SIGNED_UPLOAD_TTL_SECONDS = 60 * 60;

/**
 * Bir videonun R2'deki klasörü: "videos/<rastgele-id>/".
 *
 * Bu desen bir güvenlik siniri: R2'de toplu silme YALNIZCA bu kalıba uyan bir
 * ön ek için yapilabilir. Boş ya da hatalı bir ön ekle çağrılan bir silme
 * işlemi bucket'ın tamamını süpürebilirdi.
 */
export const VIDEO_PREFIX_PATTERN = /^videos\/[a-z0-9]{8,40}\/$/;

export function isVideoPrefix(value: unknown): value is string {
  return typeof value === "string" && VIDEO_PREFIX_PATTERN.test(value);
}
