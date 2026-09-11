import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Video izleme ilerlemesi.
 *
 * Öğrenci başına video başına TEK satır ve o satır hep EN İLERİ noktayı
 * gösterir: geri sarıp bir yeri tekrar izlemek ilerlemeyi düşürmez.
 */

/**
 * "İzledi" sayılma eşiği.
 *
 * %100 beklemek gerçekçi değil: jenerik/veda kısmını izlemeden kapatan öğrenci
 * bitirmemiş sayılırdı. Sondaki son saniyeler de çoğu oynatıcıda tam olarak
 * yakalanamıyor.
 */
export const IZLENDI_ESIGI = 0.9;

export function izlendiMi(positionSec: number, durationSec: number): boolean {
  if (durationSec <= 0) return false;
  return positionSec / durationSec >= IZLENDI_ESIGI;
}

export async function izlemeKaydet(params: {
  videoId: string;
  userId: string;
  positionSec: number;
  durationSec: number;
}): Promise<void> {
  const { videoId, userId } = params;

  const durationSec = Math.max(0, Math.round(params.durationSec));
  if (durationSec <= 0) return;
  const positionSec = Math.max(0, Math.min(Math.round(params.positionSec), durationSec));

  const simdi = new Date();
  const bitti = izlendiMi(positionSec, durationSec);

  const mevcut = await prisma.videoProgress.findUnique({
    where: { videoId_userId: { videoId, userId } },
    select: { positionSec: true, completedAt: true },
  });

  if (!mevcut) {
    await prisma.videoProgress.create({
      data: {
        videoId,
        userId,
        positionSec,
        durationSec,
        completedAt: bitti ? simdi : null,
        lastWatchedAt: simdi,
      },
    });
    return;
  }

  await prisma.videoProgress.update({
    where: { videoId_userId: { videoId, userId } },
    data: {
      // Geri sarmak ilerlemeyi silmez.
      positionSec: Math.max(mevcut.positionSec, positionSec),
      durationSec,
      // İlk tamamlama anı korunur.
      completedAt: mevcut.completedAt ?? (bitti ? simdi : null),
      lastWatchedAt: simdi,
    },
  });
}

export type OgrenciIzleme = {
  positionSec: number;
  durationSec: number;
  tamamlandi: boolean;
};

/** Öğrencinin bir videodaki durumu — kaldığı yerden devam için. */
export async function ogrenciIzlemesi(
  videoId: string,
  userId: string,
): Promise<OgrenciIzleme | null> {
  const satir = await prisma.videoProgress.findUnique({
    where: { videoId_userId: { videoId, userId } },
    select: { positionSec: true, durationSec: true, completedAt: true },
  });
  if (!satir) return null;
  return {
    positionSec: satir.positionSec,
    durationSec: satir.durationSec,
    tamamlandi: satir.completedAt !== null,
  };
}

/** Öğrencinin tüm videolardaki durumu — liste sayfasındaki çubuklar için. */
export async function ogrencininIzlemeleri(
  userId: string,
): Promise<Map<string, OgrenciIzleme>> {
  const satirlar = await prisma.videoProgress.findMany({
    where: { userId },
    select: {
      videoId: true,
      positionSec: true,
      durationSec: true,
      completedAt: true,
    },
  });

  return new Map(
    satirlar.map((satir) => [
      satir.videoId,
      {
        positionSec: satir.positionSec,
        durationSec: satir.durationSec,
        tamamlandi: satir.completedAt !== null,
      },
    ]),
  );
}

export type IzleyenOgrenci = {
  userId: string;
  ad: string;
  gradeLevel: number | null;
  positionSec: number;
  durationSec: number;
  yuzde: number;
  tamamlandi: boolean;
  sonIzleme: Date;
};

/** Bir videoyu izleyen öğrenciler (yalnızca admin görür). */
export async function videoIzleyenleri(videoId: string): Promise<IzleyenOgrenci[]> {
  const satirlar = await prisma.videoProgress.findMany({
    where: { videoId },
    orderBy: [{ completedAt: "asc" }, { lastWatchedAt: "desc" }],
    include: {
      user: { select: { id: true, username: true, fullName: true, gradeLevel: true } },
    },
  });

  return satirlar.map((satir) => ({
    userId: satir.user.id,
    ad: satir.user.fullName ?? satir.user.username,
    gradeLevel: satir.user.gradeLevel,
    positionSec: satir.positionSec,
    durationSec: satir.durationSec,
    yuzde:
      satir.durationSec > 0
        ? Math.min(100, Math.round((satir.positionSec / satir.durationSec) * 100))
        : 0,
    tamamlandi: satir.completedAt !== null,
    sonIzleme: satir.lastWatchedAt,
  }));
}

/** Video listesinde "kaç öğrenci izledi / bitirdi" özeti. */
export async function videoIzlemeOzetleri(
  videoIds: string[],
): Promise<Map<string, { izleyen: number; bitiren: number }>> {
  if (videoIds.length === 0) return new Map();

  const satirlar = await prisma.videoProgress.findMany({
    where: { videoId: { in: videoIds } },
    select: { videoId: true, completedAt: true },
  });

  const ozet = new Map<string, { izleyen: number; bitiren: number }>();
  for (const id of videoIds) ozet.set(id, { izleyen: 0, bitiren: 0 });
  for (const satir of satirlar) {
    const mevcut = ozet.get(satir.videoId)!;
    mevcut.izleyen++;
    if (satir.completedAt) mevcut.bitiren++;
  }
  return ozet;
}

export type OgrenciVideoSatiri = {
  videoId: string;
  baslik: string;
  klasor: string | null;
  positionSec: number;
  durationSec: number;
  yuzde: number;
  tamamlandi: boolean;
  sonIzleme: Date | null;
};

/**
 * Bir öğrencinin KENDİ SINIFINDAKİ tüm videolardaki durumu.
 *
 * Hiç açılmamış videolar da listeye girer (yüzde 0): öğretmenin asıl merak
 * ettiği çoğu zaman "neyi izlemedi" sorusu.
 */
export async function ogrencininVideoDurumu(
  userId: string,
  gradeLevel: number,
): Promise<OgrenciVideoSatiri[]> {
  const [videolar, ilerlemeler] = await Promise.all([
    prisma.video.findMany({
      where: { isActive: true, grades: { some: { gradeLevel } } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        durationSec: true,
        grades: {
          where: { gradeLevel },
          select: { folder: { select: { name: true } } },
        },
      },
    }),
    prisma.videoProgress.findMany({
      where: { userId },
      select: {
        videoId: true,
        positionSec: true,
        durationSec: true,
        completedAt: true,
        lastWatchedAt: true,
      },
    }),
  ]);

  const ilerlemeHaritasi = new Map(ilerlemeler.map((i) => [i.videoId, i]));

  return videolar.map((video) => {
    const ilerleme = ilerlemeHaritasi.get(video.id);
    // Süre için önce kayıttakini, yoksa videonun kendi süresini kullan.
    const sure = ilerleme?.durationSec || video.durationSec || 0;
    const konum = ilerleme?.positionSec ?? 0;

    return {
      videoId: video.id,
      baslik: video.title,
      klasor: video.grades[0]?.folder?.name ?? null,
      positionSec: konum,
      durationSec: sure,
      yuzde: sure > 0 ? Math.min(100, Math.round((konum / sure) * 100)) : 0,
      tamamlandi: ilerleme?.completedAt != null,
      sonIzleme: ilerleme?.lastWatchedAt ?? null,
    };
  });
}
