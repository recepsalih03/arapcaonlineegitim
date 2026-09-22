import "server-only";

import type { DocumentFolder } from "@/generated/prisma/client";
import type { Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Doküman klasörleri: adminin dokümanları gruplaması için.
 * Video klasörleriyle aynı mantık: her klasör tek bir sınıfa ait.
 */

export type DocKlasorRow = DocumentFolder & { documentCount: number };

export async function listDocFoldersForGrade(grade: number): Promise<DocKlasorRow[]> {
  const folders = await prisma.documentFolder.findMany({
    where: { gradeLevel: grade },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { documentGrades: true } } },
  });
  return folders.map(({ _count, ...folder }) => ({
    ...folder,
    documentCount: _count.documentGrades,
  }));
}

/** Tüm sınıfların doküman klasörleri (form seçicileri için). */
export async function listDocFoldersByGrade(): Promise<
  Record<number, Array<{ id: string; name: string }>>
> {
  const folders = await prisma.documentFolder.findMany({
    orderBy: [{ gradeLevel: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, gradeLevel: true },
  });

  const map: Record<number, Array<{ id: string; name: string }>> = {};
  for (const { gradeLevel, ...folder } of folders) {
    (map[gradeLevel] ??= []).push(folder);
  }
  return map;
}

export async function createDocFolder(
  grade: Grade,
  name: string,
): Promise<DocumentFolder> {
  const sonuncu = await prisma.documentFolder.findFirst({
    where: { gradeLevel: grade },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.documentFolder.create({
    data: { name, gradeLevel: grade, sortOrder: (sonuncu?.sortOrder ?? 0) + 1 },
  });
}

export async function renameDocFolder(id: string, name: string): Promise<void> {
  await prisma.documentFolder.update({ where: { id }, data: { name } });
}

export async function deleteDocFolder(id: string): Promise<void> {
  await prisma.documentFolder.delete({ where: { id } });
}

export async function moveDocFolder(
  id: string,
  yon: "yukari" | "asagi",
): Promise<void> {
  const klasor = await prisma.documentFolder.findUnique({
    where: { id },
    select: { gradeLevel: true },
  });
  if (!klasor) return;

  const hepsi = await prisma.documentFolder.findMany({
    where: { gradeLevel: klasor.gradeLevel },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const index = hepsi.findIndex((f) => f.id === id);
  if (index === -1) return;

  const hedef = yon === "yukari" ? index - 1 : index + 1;
  if (hedef < 0 || hedef >= hepsi.length) return;

  const yeni = [...hepsi];
  [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];

  await prisma.$transaction(
    yeni.map((f, sira) =>
      prisma.documentFolder.update({ where: { id: f.id }, data: { sortOrder: sira } }),
    ),
  );
}

/**
 * Doküman sınıf-klasör eşleşmelerini doğrular.
 * Klasörün sınıfı ile eşleşmenin sınıfı tutmak ZORUNDA.
 */
export async function normalizeDocFolderSelection(
  secim: Array<{ gradeLevel: number; folderId: string | null }>,
): Promise<Map<number, string | null>> {
  const istenen = secim.filter((s) => s.folderId);
  const sonuc = new Map<number, string | null>(
    secim.map((s) => [s.gradeLevel, null]),
  );
  if (istenen.length === 0) return sonuc;

  const klasorler = await prisma.documentFolder.findMany({
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
