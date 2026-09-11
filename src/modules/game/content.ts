import { z } from "zod";

import type { GameType } from "@/generated/prisma/enums";

/**
 * Oyun içeriklerinin şekli.
 *
 * İçerik veritabanında JSON olarak duruyor; doğruluğu burada, tek yerde
 * zorlanıyor. Hem admin formu hem öğrenci oynatıcısı aynı şemayı kullanıyor,
 * böylece bozuk bir kayıt oynatıcıyı çökertmiyor.
 */

/** Boşluk doldurma: metin içinde [cevap] biçiminde işaretlenmiş boşluklar. */
export const bosluk = z.object({
  metin: z.string().min(3).max(4000),
});
export type BoslukIcerik = z.infer<typeof bosluk>;

/**
 * Kart, eşleştirme ve bulmacanın ortak şekli: iki alanlı çiftler.
 * Anlamı türe göre değişir:
 *   KART       → soru = ön yüz,  cevap = arka yüz
 *   ESLESTIRME → soru = soldaki, cevap = sağdaki
 *   BULMACA    → soru = ipucu,   cevap = bulunacak kelime
 */
export const ciftler = z.object({
  ciftler: z
    .array(
      z.object({
        soru: z.string().trim().min(1).max(200),
        cevap: z.string().trim().min(1).max(120),
      }),
    )
    .min(2)
    .max(60),
});
export type CiftlerIcerik = z.infer<typeof ciftler>;

export type OyunIcerik = BoslukIcerik | CiftlerIcerik;

export function icerikSemasi(type: GameType) {
  return type === "BOSLUK" ? bosluk : ciftler;
}

/** Kayıtlı JSON'u türüne göre çözer; bozuksa null döner. */
export function icerikCoz(
  type: GameType,
  raw: unknown,
): OyunIcerik | null {
  const sonuc = icerikSemasi(type).safeParse(raw);
  return sonuc.success ? sonuc.data : null;
}

// --- Boşluk doldurma metnini parçalara ayırma ------------------------------

export type BoslukParca =
  | { tur: "metin"; deger: string }
  | { tur: "bosluk"; cevap: string; sira: number };

/**
 * "Bu [kitap] çok [güzel]." → metin ve boşluk parçaları.
 *
 * Köşeli parantez seçildi çünkü klavyeden kolay yazılıyor ve Arapça metinde
 * de sorun çıkarmıyor. Kapanmayan parantez düz metin sayılır — öğretmenin
 * yazım hatası oyunu bozmasın.
 */
export function boslukParcala(metin: string): BoslukParca[] {
  const parcalar: BoslukParca[] = [];
  const desen = /\[([^\][\n]{1,60})\]/g;
  let sonIndex = 0;
  let sira = 0;

  for (const eslesme of metin.matchAll(desen)) {
    const bas = eslesme.index ?? 0;
    if (bas > sonIndex) {
      parcalar.push({ tur: "metin", deger: metin.slice(sonIndex, bas) });
    }
    parcalar.push({ tur: "bosluk", cevap: eslesme[1].trim(), sira: sira++ });
    sonIndex = bas + eslesme[0].length;
  }

  if (sonIndex < metin.length) {
    parcalar.push({ tur: "metin", deger: metin.slice(sonIndex) });
  }
  return parcalar;
}

export function boslukSayisi(metin: string): number {
  return boslukParcala(metin).filter((p) => p.tur === "bosluk").length;
}

/**
 * Cevap karşılaştırması: büyük/küçük harf, baştaki/sondaki boşluk ve Arapça
 * hareke (kısa sesli) işaretleri yok sayılır. Öğrenci hareke yazmak zorunda
 * kalmasın diye.
 */
export function cevapEsit(girilen: string, beklenen: string): boolean {
  return normalize(girilen) === normalize(beklenen);
}

function normalize(deger: string): string {
  return deger
    .trim()
    .toLocaleLowerCase("tr")
    // Arapça hareke ve tatweel işaretleri.
    .replace(/[ً-ْـٰ]/g, "")
    // Arapça elif çeşitlerini sadeleştir.
    .replace(/[آأإ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}
