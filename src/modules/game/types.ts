import type { GameType } from "@/generated/prisma/enums";

/**
 * Oyun türlerinin arayüz tarafındaki tanımları: ad, açıklama, editör etiketleri
 * ve renk. Tek yerde durur ki yeni tür eklemek bir satırlık iş olsun.
 */
export type OyunTuru = GameType;

export const OYUN_TURLERI: Record<
  OyunTuru,
  {
    ad: string;
    aciklama: string;
    ornekAd: string;
    editorBasligi: string;
    soruEtiketi: string;
    cevapEtiketi: string;
    ipucu?: string;
    /** Kart ve listelerde kullanılan degrade. */
    renk: string;
    simge: string;
  }
> = {
  BOSLUK: {
    ad: "Boşluk doldurma",
    aciklama: "Metinde gizlenen kelimeleri öğrenci yazar.",
    ornekAd: "3. Ünite — Fiil çekimleri",
    editorBasligi: "Metin",
    soruEtiketi: "Metin",
    cevapEtiketi: "Cevap",
    renk:
      "linear-gradient(135deg, var(--color-oyun-zumrut), var(--color-oyun-fistik))",
    simge: "✏️",
  },
  KART: {
    ad: "Kart",
    aciklama: "Ön yüzü soru, arka yüzü cevap olan çevrilebilir kartlar.",
    ornekAd: "1. Ünite kelimeleri",
    editorBasligi: "Kartlar",
    soruEtiketi: "Ön yüz",
    cevapEtiketi: "Arka yüz",
    renk:
      "linear-gradient(135deg, var(--color-oyun-lacivert), var(--color-oyun-firuze))",
    simge: "🗂️",
  },
  ESLESTIRME: {
    ad: "Eşleştirme",
    aciklama: "Soldaki ile sağdakini eşleştirme.",
    ornekAd: "Kelime — anlam eşleştirme",
    editorBasligi: "Eşleşecek çiftler",
    soruEtiketi: "Soldaki",
    cevapEtiketi: "Sağdaki",
    renk:
      "linear-gradient(135deg, var(--color-oyun-mercan), var(--color-oyun-altin))",
    simge: "🔗",
  },
  BULMACA: {
    ad: "Bulmaca",
    aciklama: "İpuçlarından kelime bulmaca. Izgara otomatik hazırlanır.",
    ornekAd: "Meslekler bulmacası",
    editorBasligi: "Kelimeler ve ipuçları",
    soruEtiketi: "İpucu",
    cevapEtiketi: "Kelime",
    ipucu:
      "Kelimeler ortak harflerden kesiştirilir. Kesişecek harf bulunamayan kelimeler bulmacaya girmez; kaydettikten sonra size hangilerinin dışarıda kaldığı bildirilir.",
    renk:
      "linear-gradient(135deg, var(--color-oyun-firuze), var(--color-oyun-zumrut))",
    simge: "🧩",
  },
};

export const OYUN_TURU_LISTESI = Object.keys(OYUN_TURLERI) as OyunTuru[];
