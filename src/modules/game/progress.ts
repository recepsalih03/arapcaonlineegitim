import "server-only";

import type { GameType } from "@/generated/prisma/enums";

import { prisma } from "@/lib/prisma";

/**
 * Oyun ilerlemesi.
 *
 * Öğrenci başına oyun başına TEK satır tutulur ve o satır hep EN İYİ sonucu
 * gösterir. Her denemeyi ayrı satıra yazmak tabloyu şişirir ve öğretmenin
 * bakacağı soruyu ("bu öğrenci bu alıştırmayı yapabildi mi") zorlaştırırdı.
 */

export type IlerlemeKaydi = {
  dogru: number;
  toplam: number;
  denemeSayisi: number;
  tamamlandi: boolean;
  sonOynama: Date;
};

export async function ilerlemeKaydet(params: {
  gameId: string;
  userId: string;
  dogru: number;
  toplam: number;
  /** Bu oturumdaki ilk kayıt mı? Yalnızca o zaman deneme sayısı artar. */
  yeniDeneme: boolean;
}): Promise<void> {
  const { gameId, userId, dogru, toplam, yeniDeneme } = params;
  if (toplam <= 0) return;

  const guvenliDogru = Math.max(0, Math.min(dogru, toplam));
  const bitti = guvenliDogru === toplam;
  const simdi = new Date();

  const mevcut = await prisma.gameProgress.findUnique({
    where: { gameId_userId: { gameId, userId } },
    select: { bestCorrect: true, completedAt: true },
  });

  if (!mevcut) {
    await prisma.gameProgress.create({
      data: {
        gameId,
        userId,
        bestCorrect: guvenliDogru,
        total: toplam,
        attempts: 1,
        completedAt: bitti ? simdi : null,
        lastPlayedAt: simdi,
      },
    });
    return;
  }

  await prisma.gameProgress.update({
    where: { gameId_userId: { gameId, userId } },
    data: {
      // Sonuç yalnızca iyileşir: öğrenci ikinci denemede daha kötü yaparsa
      // ilk başarısı silinmez.
      bestCorrect: Math.max(mevcut.bestCorrect, guvenliDogru),
      total: toplam,
      attempts: yeniDeneme ? { increment: 1 } : undefined,
      // İlk tamamlama anı korunur.
      completedAt: mevcut.completedAt ?? (bitti ? simdi : null),
      lastPlayedAt: simdi,
    },
  });
}

export type OgrenciIlerlemesi = {
  userId: string;
  ad: string;
  kullaniciAdi: string;
  gradeLevel: number | null;
  dogru: number;
  toplam: number;
  denemeSayisi: number;
  tamamlandi: boolean;
  sonOynama: Date;
};

/** Bir oyunu oynayan öğrenciler ve sonuçları (yalnızca admin görür). */
export async function oyunIlerlemesi(gameId: string): Promise<OgrenciIlerlemesi[]> {
  const satirlar = await prisma.gameProgress.findMany({
    where: { gameId },
    orderBy: [{ completedAt: "asc" }, { lastPlayedAt: "desc" }],
    include: {
      user: {
        select: { id: true, username: true, fullName: true, gradeLevel: true },
      },
    },
  });

  return satirlar.map((satir) => ({
    userId: satir.user.id,
    ad: satir.user.fullName ?? satir.user.username,
    kullaniciAdi: satir.user.username,
    gradeLevel: satir.user.gradeLevel,
    dogru: satir.bestCorrect,
    toplam: satir.total,
    denemeSayisi: satir.attempts,
    tamamlandi: satir.completedAt !== null,
    sonOynama: satir.lastPlayedAt,
  }));
}

/** Oyun listesinde "kaç öğrenci oynadı / bitirdi" özeti. */
export async function oyunOzetleri(
  gameIds: string[],
): Promise<Map<string, { oynayan: number; bitiren: number }>> {
  if (gameIds.length === 0) return new Map();

  const satirlar = await prisma.gameProgress.findMany({
    where: { gameId: { in: gameIds } },
    select: { gameId: true, completedAt: true },
  });

  const ozet = new Map<string, { oynayan: number; bitiren: number }>();
  for (const id of gameIds) ozet.set(id, { oynayan: 0, bitiren: 0 });
  for (const satir of satirlar) {
    const mevcut = ozet.get(satir.gameId)!;
    mevcut.oynayan++;
    if (satir.completedAt) mevcut.bitiren++;
  }
  return ozet;
}

export type OgrenciOyunSatiri = {
  gameId: string;
  baslik: string;
  tur: GameType;
  dogru: number;
  toplam: number;
  denemeSayisi: number;
  tamamlandi: boolean;
  sonOynama: Date | null;
};

/**
 * Bir öğrencinin KENDİ SINIFINDAKİ tüm oyunlardaki durumu.
 * Hiç oynanmamış oyunlar da listeye girer.
 */
export async function ogrencininOyunDurumu(
  userId: string,
  gradeLevel: number,
): Promise<OgrenciOyunSatiri[]> {
  const [oyunlar, ilerlemeler] = await Promise.all([
    prisma.game.findMany({
      where: { isActive: true, grades: { some: { gradeLevel } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, type: true },
    }),
    prisma.gameProgress.findMany({
      where: { userId },
      select: {
        gameId: true,
        bestCorrect: true,
        total: true,
        attempts: true,
        completedAt: true,
        lastPlayedAt: true,
      },
    }),
  ]);

  const harita = new Map(ilerlemeler.map((i) => [i.gameId, i]));

  return oyunlar.map((oyun) => {
    const ilerleme = harita.get(oyun.id);
    return {
      gameId: oyun.id,
      baslik: oyun.title,
      tur: oyun.type,
      dogru: ilerleme?.bestCorrect ?? 0,
      toplam: ilerleme?.total ?? 0,
      denemeSayisi: ilerleme?.attempts ?? 0,
      tamamlandi: ilerleme?.completedAt != null,
      sonOynama: ilerleme?.lastPlayedAt ?? null,
    };
  });
}
