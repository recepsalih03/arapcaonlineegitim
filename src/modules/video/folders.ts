import "server-only";

import type { VideoFolder } from "@/generated/prisma/client";
import type { Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Video klasörleri: adminin videoları gruplaması için.
 *
 * Her klasör TEK BİR sınıfa aittir. 6. sınıfın "A Yayınevi" klasörüyle
 * 7. sınıfınki ayrı kayıtlardır; içerikleri de zaten farklı videolardır.
 * Bu yüzden klasör yönetimi sınıf panelinin içinde durur.
 */

export type KlasorRow = VideoFolder & { videoCount: number };

export async function listFoldersForGrade(grade: number): Promise<KlasorRow[]> {
  const folders = await prisma.videoFolder.findMany({
    where: { gradeLevel: grade },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { videoGrades: true } } },
  });
  return folders.map(({ _count, ...folder }) => ({
    ...folder,
    videoCount: _count.videoGrades,
  }));
}

/** Video formunda sınıf seçildikçe kullanılacak: tüm sınıfların klasörleri. */
export async function listFoldersByGrade(): Promise<
  Record<number, Array<{ id: string; name: string }>>
> {
  const folders = await prisma.videoFolder.findMany({
    orderBy: [{ gradeLevel: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, gradeLevel: true },
  });

  const map: Record<number, Array<{ id: string; name: string }>> = {};
  for (const { gradeLevel, ...folder } of folders) {
    (map[gradeLevel] ??= []).push(folder);
  }
  return map;
}

export async function createFolder(
  grade: Grade,
  name: string,
): Promise<VideoFolder> {
  // Yeni klasör kendi sınıfının listesinin sonuna eklenir.
  const sonuncu = await prisma.videoFolder.findFirst({
    where: { gradeLevel: grade },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.videoFolder.create({
    data: { name, gradeLevel: grade, sortOrder: (sonuncu?.sortOrder ?? 0) + 1 },
  });
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await prisma.videoFolder.update({ where: { id }, data: { name } });
}

/**
 * Klasörü siler. İçindeki videolar SİLİNMEZ; o sınıfta klasörsüz kalır ve
 * listede "Diğer" başlığı altında görünür (şemada onDelete: SetNull).
 */
export async function deleteFolder(id: string): Promise<void> {
  await prisma.videoFolder.delete({ where: { id } });
}

export async function moveFolder(
  id: string,
  yon: "yukari" | "asagi",
): Promise<void> {
  const klasor = await prisma.videoFolder.findUnique({
    where: { id },
    select: { gradeLevel: true },
  });
  if (!klasor) return;

  const hepsi = await prisma.videoFolder.findMany({
    where: { gradeLevel: klasor.gradeLevel },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const index = hepsi.findIndex((f) => f.id === id);
  if (index === -1) return;

  const hedef = yon === "yukari" ? index - 1 : index + 1;
  if (hedef < 0 || hedef >= hepsi.length) return;

  // Sıra numaralarını baştan yazmak, elle takas etmekten daha dayanıklı:
  // eşit/boşluklu sortOrder değerleri kendiliğinden düzelir.
  const yeni = [...hepsi];
  [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];

  await prisma.$transaction(
    yeni.map((f, sira) =>
      prisma.videoFolder.update({ where: { id: f.id }, data: { sortOrder: sira } }),
    ),
  );
}

/**
 * Bir videonun sınıf-klasör eşleşmelerini yazar.
 *
 * Klasörün sınıfı ile eşleşmenin sınıfı tutmak ZORUNDA: aksi hâlde 7. sınıf
 * videosu 5. sınıfın klasörüne düşer ve öğrenci listesi anlamsızlaşır.
 * Uyuşmayan klasör sessizce yok sayılır (video o sınıfta "Diğer"e düşer).
 */
export async function normalizeFolderSelection(
  secim: Array<{ gradeLevel: number; folderId: string | null }>,
): Promise<Map<number, string | null>> {
  const istenen = secim.filter((s) => s.folderId);
  const sonuc = new Map<number, string | null>(
    secim.map((s) => [s.gradeLevel, null]),
  );
  if (istenen.length === 0) return sonuc;

  const klasorler = await prisma.videoFolder.findMany({
    where: { id: { in: istenen.map((s) => s.folderId!) } },
    select: { id: true, gradeLevel: true },
  });
  const sinifById = new Map(klasorler.map((k) => [k.id, k.gradeLevel]));

  for (const { gradeLevel, folderId } of istenen) {
    if (folderId && sinifById.get(folderId) === gradeLevel) {
      sonuc.set(gradeLevel, folderId);
    }
  }
  return sonuc;
}
