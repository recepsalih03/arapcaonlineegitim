import "server-only";

import { prisma } from "@/lib/prisma";
import { beklemeSuresiMs, degerlendir } from "@/modules/auth/throttle-logic";

export { beklemeSuresiMs, degerlendir, SERBEST_DENEME } from "@/modules/auth/throttle-logic";
export type { KilitDurumu } from "@/modules/auth/throttle-logic";

/**
 * Giriş için kaba kuvvet (brute-force) koruması — veritabanına dokunan kısım.
 * Saf mantık (bekleme kademeleri, kilit değerlendirmesi) throttle-logic.ts'de.
 *
 * Vercel Hobby'de Redis yok; sınır bu yüzden veritabanında tutuluyor (User
 * üzerindeki failedLoginCount / lockedUntil alanları). Hesap bazlı çalışır:
 * asıl tehdit, tek admin hesabına ("musahoca") sınırsız şifre denenmesidir.
 *
 * Kilit KALICI DEĞİL: belirli sayıda hatadan sonra kısa bir bekleme konur ve
 * süre dolunca kendiliğinden açılır. Kalıcı kilit, saldırganın yanlış şifre
 * yağdırıp gerçek kullanıcıyı dışarıda bırakmasına (hizmet reddi) yol açardı.
 */

/**
 * Hesap şu an giriş denemesine kapalı mı? Kapalıysa kaç saniye kaldığını döner.
 * Sadece okur; sayaç değiştirmez.
 */
export async function kilitDurumu(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { lockedUntil: true },
  });
  return degerlendir(user?.lockedUntil ?? null);
}

/**
 * Başarısız denemeyi kaydeder ve gerekiyorsa hesabı kısa süre kilitler.
 * Kullanıcı yoksa sessizce geçilir (kullanıcı adı sızmasın diye).
 */
export async function basarisizDenemeyiIsle(username: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, failedLoginCount: true },
  });
  if (!user) return;

  const yeniSayi = user.failedLoginCount + 1;
  const bekleme = beklemeSuresiMs(yeniSayi);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: yeniSayi,
      lockedUntil: bekleme > 0 ? new Date(Date.now() + bekleme) : null,
    },
  });
}

/** Başarılı girişten sonra sayacı sıfırlar. */
export async function sayaciSifirla(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
}
