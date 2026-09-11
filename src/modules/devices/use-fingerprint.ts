"use client";

import { useEffect, useState } from "react";

/**
 * Cihaz kimliği (PROJE.md §5a — 4 cihaz limiti için).
 *
 * TASARIM KURALI: cihaz kimliği giriş yapmanın ÖNÜNE GEÇEMEZ.
 * Önceki sürüm parmak izi hesaplanana kadar giriş butonunu kilitliyordu;
 * FingerprintJS telefonda takılınca öğrenci hiç giriş yapamıyordu. Cihaz
 * limiti yardımcı bir özellik, girişin şartı değil.
 *
 * Nasıl çalışıyor:
 *  1. Kimlik bir kez üretilip localStorage'a yazılır ve HEP o kullanılır.
 *     Böylece ilk girişte parmak izi yetişmese bile sonraki girişlerde aynı
 *     cihaz olarak tanınır (aksi hâlde her giriş yeni cihaz sayılır, limit
 *     boşuna dolardı).
 *  2. Kayıtlı kimlik yoksa FingerprintJS 3 saniye denenir.
 *  3. Yetişmez ya da patlarsa yerel rastgele kimlik üretilir.
 *
 * Neden yerel kimlik yeterli: parmak izinin tek üstünlüğü depolama
 * temizlendiğinde de cihazı tanıyabilmesi. Zaten "en iyi çaba" olarak
 * kabul edilmiş bir özellik için bu, girişin kilitlenmesine değmez.
 */

const ANAHTAR = "arapca.cihaz-kimligi";
const ZAMAN_ASIMI_MS = 3000;

/** localStorage gizli sekmede/kısıtlı ayarlarda hata fırlatabiliyor. */
function guvenliOku(): string | null {
  try {
    return window.localStorage.getItem(ANAHTAR);
  } catch {
    return null;
  }
}

function guvenliYaz(deger: string): void {
  try {
    window.localStorage.setItem(ANAHTAR, deger);
  } catch {
    // Yazamıyorsak kimlik oturumluk olur; giriş yine de çalışır.
  }
}

/**
 * Rastgele kimlik.
 *
 * crypto.randomUUID BİLEREK kullanılmıyor: yalnızca güvenli bağlamda
 * (https ya da localhost) tanımlı. Telefondan `http://192.168.x.x:3000`
 * ile girildiğinde tanımsız olur ve hata fırlatırdı.
 */
function rastgeleKimlik(): string {
  const harfler = "abcdefghijklmnopqrstuvwxyz0123456789";
  let sonuc = "";

  const kripto = typeof crypto !== "undefined" ? crypto : undefined;
  if (kripto?.getRandomValues) {
    const bayt = new Uint32Array(24);
    kripto.getRandomValues(bayt);
    for (const b of bayt) sonuc += harfler[b % harfler.length];
    return sonuc;
  }

  for (let i = 0; i < 24; i++) {
    sonuc += harfler[Math.floor(Math.random() * harfler.length)];
  }
  return sonuc;
}

function zamanAsimi<T>(soz: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    soz,
    new Promise<never>((_, reddet) =>
      setTimeout(() => reddet(new Error("zaman aşımı")), ms),
    ),
  ]);
}

async function parmakIziDene(): Promise<string> {
  const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
  const ajan = await FingerprintJS.load();
  const sonuc = await ajan.get();
  return `fp_${sonuc.visitorId}`;
}

/**
 * Kayıtlı kimliği döndürür; yoksa üretip kaydeder.
 * Senkron çağrılabilir — form gönderilirken kimlik hazır değilse son çare
 * olarak bu kullanılır, böylece boş parmak izi sunucuya hiç gitmez.
 */
export function cihazKimligiHemen(): string {
  const kayitli = guvenliOku();
  if (kayitli) return kayitli;

  const yeni = `yerel_${rastgeleKimlik()}`;
  guvenliYaz(yeni);
  return yeni;
}

export function useFingerprint(): { fingerprint: string | null } {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;

    async function hesapla() {
      const kayitli = guvenliOku();
      if (kayitli) {
        if (!iptal) setFingerprint(kayitli);
        return;
      }

      let kimlik: string;
      try {
        kimlik = await zamanAsimi(parmakIziDene(), ZAMAN_ASIMI_MS);
      } catch {
        kimlik = `yerel_${rastgeleKimlik()}`;
      }

      guvenliYaz(kimlik);
      if (!iptal) setFingerprint(kimlik);
    }

    void hesapla();
    return () => {
      iptal = true;
    };
  }, []);

  return { fingerprint };
}
