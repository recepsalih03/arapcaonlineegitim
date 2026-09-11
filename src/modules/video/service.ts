import "server-only";

import type { Video } from "@/generated/prisma/client";
import { GRADES, isVideoPrefix, type Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { deletePrefix } from "@/lib/r2";

/** Video listeleme, erişim kontrolü ve public kısıtı (PROJE.md §6). */

export type VideoGradeBilgisi = {
  gradeLevel: number;
  folderId: string | null;
  folder: { id: string; name: string; sortOrder: number } | null;
};

export type VideoWithGrades = Video & { grades: VideoGradeBilgisi[] };

const withGrades = {
  grades: {
    select: {
      gradeLevel: true,
      folderId: true,
      folder: { select: { id: true, name: true, sortOrder: true } },
    },
    orderBy: { gradeLevel: "asc" },
  },
} as const;

/** Klasörsüz videoların listede toplandığı başlık. */
export const KLASORSUZ_BASLIK = "Diğer";

export type VideoGrubu = { klasorAdi: string; videolar: VideoWithGrades[] };

/** Videonun BELİRLİ bir sınıftaki klasörü. Klasörler sınıfa özel olduğu için
 * "videonun klasörü" diye tek bir cevap yok; sınıfı vermek zorunlu. */
export function klasorOf(
  video: VideoWithGrades,
  grade: number,
): { id: string; name: string; sortOrder: number } | null {
  return video.grades.find((g) => g.gradeLevel === grade)?.folder ?? null;
}

/**
 * Videoları BİR SINIFIN klasörlerine göre gruplar. Klasörsüzler en sonda
 * "Diğer" altında toplanır; boş klasör hiç görünmez.
 */
export function gruplaKlasore(
  videolar: VideoWithGrades[],
  grade: number,
): VideoGrubu[] {
  const gruplar = new Map<string, { sira: number; grup: VideoGrubu }>();

  for (const video of videolar) {
    const klasor = klasorOf(video, grade);
    const anahtar = klasor?.id ?? "__klasorsuz__";
    if (!gruplar.has(anahtar)) {
      gruplar.set(anahtar, {
        // Klasörsüzler her zaman en sonda.
        sira: klasor ? klasor.sortOrder : Number.MAX_SAFE_INTEGER,
        grup: { klasorAdi: klasor?.name ?? KLASORSUZ_BASLIK, videolar: [] },
      });
    }
    gruplar.get(anahtar)!.grup.videolar.push(video);
  }

  return [...gruplar.values()]
    .sort((a, b) => a.sira - b.sira)
    .map((x) => x.grup);
}

/** Öğrencinin sınıfına ait aktif videolar. */
export async function listVideosForGrade(grade: number): Promise<VideoWithGrades[]> {
  return prisma.video.findMany({
    where: { isActive: true, grades: { some: { gradeLevel: grade } } },
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllVideos(): Promise<VideoWithGrades[]> {
  return prisma.video.findMany({
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function getVideo(id: string): Promise<VideoWithGrades | null> {
  return prisma.video.findUnique({ where: { id }, include: withGrades });
}

export async function getPublicVideoBySlug(
  slug: string,
): Promise<VideoWithGrades | null> {
  return prisma.video.findFirst({
    where: { publicSlug: slug, isPublic: true, isActive: true },
    include: withGrades,
  });
}

/** Sınıf başına en fazla 1 public video kuralının mevcut durumu. */
export async function listPublicVideosByGrade(): Promise<
  Map<number, VideoWithGrades>
> {
  const videos = await prisma.video.findMany({
    where: { isPublic: true, isActive: true },
    include: withGrades,
  });
  const map = new Map<number, VideoWithGrades>();
  for (const video of videos) {
    for (const { gradeLevel } of video.grades) {
      map.set(gradeLevel, video);
    }
  }
  return map;
}

/**
 * Bu kullanıcı bu videoyu izleyebilir mi? (PROJE.md §6b)
 * - Public video: herkese açık, girişsiz de izlenir.
 * - Diğerleri: yalnızca videonun işaretli olduğu sınıftaki öğrenci ve admin.
 */
export type ViewerContext =
  | { kind: "admin" }
  | { kind: "student"; gradeLevel: number }
  | { kind: "guest" };

export function canWatch(video: VideoWithGrades, viewer: ViewerContext): boolean {
  if (!video.isActive) return false;
  if (viewer.kind === "admin") return true;
  if (video.isPublic) return true;
  if (viewer.kind === "student") {
    return video.grades.some((g) => g.gradeLevel === viewer.gradeLevel);
  }
  return false;
}

export type SaveVideoInput = {
  title: string;
  description: string | null;
  hlsPrefix: string;
  playlistName: string;
  posterKey: string | null;
  durationSec: number | null;
  /** Sınıf → o sınıftaki klasör (null = klasörsüz). */
  grades: Array<{ gradeLevel: Grade; folderId: string | null }>;
};

export async function createVideo(input: SaveVideoInput): Promise<Video> {
  return prisma.video.create({
    data: {
      title: input.title,
      description: input.description,
      hlsPrefix: input.hlsPrefix,
      playlistName: input.playlistName,
      posterKey: input.posterKey,
      durationSec: input.durationSec,
      grades: {
        create: input.grades.map(({ gradeLevel, folderId }) => ({
          gradeLevel,
          folderId,
        })),
      },
    },
  });
}

export async function updateVideoMeta(
  id: string,
  input: {
    title: string;
    description: string | null;
    grades: Array<{ gradeLevel: Grade; folderId: string | null }>;
    isActive: boolean;
  },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.videoGrade.deleteMany({ where: { videoId: id } });
    await tx.video.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        isActive: input.isActive,
        grades: {
          create: input.grades.map(({ gradeLevel, folderId }) => ({
            gradeLevel,
            folderId,
          })),
        },
      },
    });
  });

  // Sınıflar değiştiyse public kısıtı yeniden bozulmuş olabilir.
  const video = await getVideo(id);
  if (video?.isPublic) {
    await enforceSinglePublicPerGrade(id);
  }
}

/**
 * Videoyu public yapar veya public'liğini kaldırır (PROJE.md §6d-e).
 *
 * Kritik kural: her sınıf seviyesi için aynı anda EN FAZLA 1 public video.
 * Yeni bir video public yapıldığında, onunla aynı sınıfı paylaşan eski public
 * videoların public işareti otomatik kaldırılır — yanlış işaretlemeye karşı
 * koruma. Kural burada, tek noktada zorlanır.
 */
export async function setVideoPublic(
  id: string,
  isPublic: boolean,
): Promise<{ publicSlug: string | null }> {
  if (!isPublic) {
    const updated = await prisma.video.update({
      where: { id },
      data: { isPublic: false, publicSlug: null },
      select: { publicSlug: true },
    });
    return updated;
  }

  const slug = await generateUniqueSlug();
  const updated = await prisma.video.update({
    where: { id },
    data: { isPublic: true, publicSlug: slug },
    select: { publicSlug: true },
  });

  await enforceSinglePublicPerGrade(id);
  return updated;
}

/** `keepVideoId` ile sınıf paylaşan diğer public videoların işaretini kaldırır. */
async function enforceSinglePublicPerGrade(keepVideoId: string): Promise<void> {
  const keep = await prisma.video.findUnique({
    where: { id: keepVideoId },
    include: withGrades,
  });
  if (!keep || !keep.isPublic) return;

  const gradeLevels = keep.grades.map((g) => g.gradeLevel);
  if (gradeLevels.length === 0) return;

  await prisma.video.updateMany({
    where: {
      isPublic: true,
      id: { not: keepVideoId },
      grades: { some: { gradeLevel: { in: gradeLevels } } },
    },
    data: { isPublic: false, publicSlug: null },
  });
}

async function generateUniqueSlug(): Promise<string> {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = new Uint32Array(10);
    crypto.getRandomValues(bytes);
    const slug = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    const clash = await prisma.video.findUnique({
      where: { publicSlug: slug },
      select: { id: true },
    });
    if (!clash) return slug;
  }
  throw new Error("Public video linki üretilemedi, lütfen tekrar deneyin.");
}

/** Videoyu ve R2'deki dosyalarını siler. */
export async function deleteVideo(id: string): Promise<void> {
  const video = await prisma.video.findUnique({
    where: { id },
    select: { hlsPrefix: true },
  });

  // Ön ek bozuksa dosyalara HİÇ dokunma: kaydı sil, dosyalar bucket'ta kalsın.
  // Şüpheli bir silme işlemi yapmaktansa birkaç yetim dosya bırakmak yeğdir.
  const silinebilir = isVideoPrefix(video?.hlsPrefix);
  if (video && !silinebilir) {
    console.error(
      "Video kaydının R2 klasörü beklenen biçimde değil, dosyalar silinmedi:",
      video.hlsPrefix,
    );
  }

  await prisma.video.delete({ where: { id } });

  if (video && silinebilir) {
    // R2 temizliği başarısız olursa kayıt yine de silinmiş olur; artık dosyalar
    // erişilemez durumdadır. Hatayı yutup log'larız.
    await deletePrefix(video.hlsPrefix).catch((error) => {
      console.error("R2 temizliği başarısız:", video.hlsPrefix, error);
    });
  }
}

/** Genel panel için sınıf başına video sayısı. */
export async function countVideosByGrade(): Promise<Record<number, number>> {
  const rows = await prisma.videoGrade.groupBy({
    by: ["gradeLevel"],
    _count: { _all: true },
    where: { video: { isActive: true } },
  });
  const counts: Record<number, number> = Object.fromEntries(
    GRADES.map((g) => [g, 0]),
  );
  for (const row of rows) {
    counts[row.gradeLevel] = row._count._all;
  }
  return counts;
}
