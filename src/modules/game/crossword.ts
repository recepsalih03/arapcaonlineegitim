/**
 * Bulmaca (crossword) yerleşimi üretici.
 *
 * Öğretmen yalnızca kelime + ipucu girer; ızgarayı bu kod kurar. Elle ızgara
 * çizdiren bir editör hem yapımı hem kullanımı çok zahmetli olurdu.
 *
 * Algoritma: kelimeleri uzundan kısaya sırala, ilkini ortaya yatay koy, her
 * yeni kelimeyi yerleşmiş kelimelerle ORTAK HARF üzerinden kesiştirmeyi dene,
 * kesişim bulunamayan kelimeyi atla. Basit ama pratikte 8-15 kelimelik okul
 * bulmacaları için yeterli ve saniyenin altında sonuç veriyor.
 *
 * Arapça: kelimeler sağdan sola okunur. Izgarada harfleri ters sırada
 * yerleştirmek yerine yerleşim aynı kalır, gösterim tarafında sütunlar ters
 * çevrilir (bkz. oyun bileşeni). Böylece algoritma tek biçimde kalıyor.
 */

export type YerlesikKelime = {
  kelime: string;
  ipucu: string;
  satir: number;
  sutun: number;
  yatay: boolean;
  /** Bulmacada gösterilen numara. */
  numara: number;
};

export type BulmacaYerlesimi = {
  satirSayisi: number;
  sutunSayisi: number;
  kelimeler: YerlesikKelime[];
  /** Yerleştirilemeyen kelimeler — admin'e uyarı göstermek için. */
  disariKalanlar: string[];
};

type Aday = { kelime: string; ipucu: string; harfler: string[] };

/** Izgaraya yazılacak harfe indirger: boşluk ve harekeler atılır. */
export function bulmacaHarfleri(kelime: string): string[] {
  return kelime
    .replace(/[ً-ْـٰ]/g, "")
    .replace(/\s+/g, "")
    .toLocaleUpperCase("tr")
    .split("");
}

export function bulmacaUret(
  girdiler: Array<{ soru: string; cevap: string }>,
): BulmacaYerlesimi {
  const adaylar: Aday[] = girdiler
    .map((g) => ({
      kelime: g.cevap.trim(),
      ipucu: g.soru.trim(),
      harfler: bulmacaHarfleri(g.cevap),
    }))
    .filter((a) => a.harfler.length >= 2)
    .sort((a, b) => b.harfler.length - a.harfler.length);

  if (adaylar.length === 0) {
    return { satirSayisi: 0, sutunSayisi: 0, kelimeler: [], disariKalanlar: [] };
  }

  // Izgara sınırsız büyüyebilsin diye koordinatlar negatif de olabilir;
  // sonunda hepsi sıfıra kaydırılır.
  const dolu = new Map<string, string>();
  const yerlesenler: Omit<YerlesikKelime, "numara">[] = [];
  const disariKalanlar: string[] = [];

  const anahtar = (r: number, c: number) => `${r},${c}`;

  function yaz(aday: Aday, satir: number, sutun: number, yatay: boolean) {
    aday.harfler.forEach((harf, i) => {
      const r = yatay ? satir : satir + i;
      const c = yatay ? sutun + i : sutun;
      dolu.set(anahtar(r, c), harf);
    });
    yerlesenler.push({
      kelime: aday.harfler.join(""),
      ipucu: aday.ipucu,
      satir,
      sutun,
      yatay,
    });
  }

  /** Kelime bu konuma kurallara uygun yerleşebilir mi? */
  function uygunMu(aday: Aday, satir: number, sutun: number, yatay: boolean) {
    const n = aday.harfler.length;

    // Kelimenin hemen önü ve arkası boş olmalı; yoksa iki kelime birleşir.
    const oncekiR = yatay ? satir : satir - 1;
    const oncekiC = yatay ? sutun - 1 : sutun;
    const sonrakiR = yatay ? satir : satir + n;
    const sonrakiC = yatay ? sutun + n : sutun;
    if (dolu.has(anahtar(oncekiR, oncekiC))) return false;
    if (dolu.has(anahtar(sonrakiR, sonrakiC))) return false;

    let kesisim = 0;
    for (let i = 0; i < n; i++) {
      const r = yatay ? satir : satir + i;
      const c = yatay ? sutun + i : sutun;
      const mevcut = dolu.get(anahtar(r, c));

      if (mevcut) {
        if (mevcut !== aday.harfler[i]) return false;
        kesisim++;
        continue;
      }

      // Boş hücreye yazıyorsak, yanlarında harf olmamalı: aksi hâlde yan yana
      // iki kelime istemeden birbirine yapışıp anlamsız dizi oluşturur.
      const yanA = yatay ? anahtar(r - 1, c) : anahtar(r, c - 1);
      const yanB = yatay ? anahtar(r + 1, c) : anahtar(r, c + 1);
      if (dolu.has(yanA) || dolu.has(yanB)) return false;
    }

    return kesisim > 0;
  }

  // İlk kelime merkeze yatay.
  yaz(adaylar[0], 0, 0, true);

  /** Bir kelimeyi yerleşmişlerle kesiştirmeyi dener. */
  function yerlestir(aday: Aday): boolean {
    let kondu = false;

    dis: for (const yerlesik of yerlesenler) {
      const yerlesikHarfler = yerlesik.kelime.split("");

      for (let i = 0; i < aday.harfler.length && !kondu; i++) {
        for (let j = 0; j < yerlesikHarfler.length; j++) {
          if (aday.harfler[i] !== yerlesikHarfler[j]) continue;

          // Yerleşik yataysa yenisi dikey olmalı (ve tersi).
          const yatay = !yerlesik.yatay;
          const satir = yerlesik.yatay ? yerlesik.satir - i : yerlesik.satir + j;
          const sutun = yerlesik.yatay ? yerlesik.sutun + j : yerlesik.sutun - i;

          if (uygunMu(aday, satir, sutun, yatay)) {
            yaz(aday, satir, sutun, yatay);
            kondu = true;
            break dis;
          }
        }
      }
    }

    return kondu;
  }

  const bekleyenler: Aday[] = [];
  for (const aday of adaylar.slice(1)) {
    if (!yerlestir(aday)) bekleyenler.push(aday);
  }

  // İkinci tur: ilk turda kesişecek harf bulamayan kelimeler, ızgara
  // büyüdükten sonra çoğu zaman yer buluyor. Ucuz ama yerleşme oranını
  // belirgin biçimde artırıyor (özellikle Arapça'da, harf çeşitliliği düşük).
  for (let tur = 0; tur < 2 && bekleyenler.length > 0; tur++) {
    for (let i = bekleyenler.length - 1; i >= 0; i--) {
      if (yerlestir(bekleyenler[i])) bekleyenler.splice(i, 1);
    }
  }
  disariKalanlar.push(...bekleyenler.map((a) => a.kelime));

  // Koordinatları sıfırdan başlat.
  const satirlar = yerlesenler.flatMap((k) =>
    k.yatay ? [k.satir] : [k.satir, k.satir + k.kelime.length - 1],
  );
  const sutunlar = yerlesenler.flatMap((k) =>
    k.yatay ? [k.sutun, k.sutun + k.kelime.length - 1] : [k.sutun],
  );
  const enUstSatir = Math.min(...satirlar);
  const enSolSutun = Math.min(...sutunlar);

  const kaydirilmis = yerlesenler.map((k) => ({
    ...k,
    satir: k.satir - enUstSatir,
    sutun: k.sutun - enSolSutun,
  }));

  // Numaralar okuma sırasına göre: üstten alta, soldan sağa.
  const sirali = [...kaydirilmis].sort(
    (a, b) => a.satir - b.satir || a.sutun - b.sutun,
  );
  const numaralar = new Map<string, number>();
  let sonraki = 1;
  for (const k of sirali) {
    const key = anahtar(k.satir, k.sutun);
    if (!numaralar.has(key)) numaralar.set(key, sonraki++);
  }

  const kelimeler: YerlesikKelime[] = sirali.map((k) => ({
    ...k,
    numara: numaralar.get(anahtar(k.satir, k.sutun))!,
  }));

  return {
    satirSayisi: Math.max(...kelimeler.map((k) => (k.yatay ? k.satir : k.satir + k.kelime.length - 1))) + 1,
    sutunSayisi: Math.max(...kelimeler.map((k) => (k.yatay ? k.sutun + k.kelime.length - 1 : k.sutun))) + 1,
    kelimeler,
    disariKalanlar,
  };
}
