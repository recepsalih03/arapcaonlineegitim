import "server-only";

import type { Document } from "@/generated/prisma/client";
import { GRADES, isDocumentPrefix, type Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { deleteDocPrefix } from "@/lib/r2";

/** Doküman modülü: PDF/Word vb. dosyaların listelenmesi ve yönetimi. */

export type DocumentGradeBilgisi = {
  gradeLevel: number;
  folderId: string | null;
  folder: { id: string; name: string; sortOrder: number } | null;
};

export type DocumentWithGrades = Document & { grades: DocumentGradeBilgisi[] };

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

/** Klasörsüz dokümanların listede toplandığı başlık. */
export const DOC_KLASORSUZ_BASLIK = "Diğer";

export type DokumanGrubu = { klasorAdi: string; dokumanlar: DocumentWithGrades[] };

/** Dokümanın BELİRLİ bir sınıftaki klasörü. */
export function docKlasorOf(
  doc: DocumentWithGrades,
  grade: number,
): { id: string; name: string; sortOrder: number } | null {
  return doc.grades.find((g) => g.gradeLevel === grade)?.folder ?? null;
}

/**
 * Dokümanları BİR SINIFIN klasörlerine göre gruplar. Klasörsüzler en sonda
 * "Diğer" altında toplanır; boş klasör hiç görünmez.
 */
export function gruplaDocKlasore(
  dokumanlar: DocumentWithGrades[],
  grade: number,
): DokumanGrubu[] {
  const gruplar = new Map<string, { sira: number; grup: DokumanGrubu }>();

  for (const doc of dokumanlar) {
    const klasor = docKlasorOf(doc, grade);
    const anahtar = klasor?.id ?? "__klasorsuz__";
    if (!gruplar.has(anahtar)) {
      gruplar.set(anahtar, {
        sira: klasor ? klasor.sortOrder : Number.MAX_SAFE_INTEGER,
        grup: { klasorAdi: klasor?.name ?? DOC_KLASORSUZ_BASLIK, dokumanlar: [] },
      });
    }
    gruplar.get(anahtar)!.grup.dokumanlar.push(doc);
  }

  return [...gruplar.values()]
    .sort((a, b) => a.sira - b.sira)
    .map((x) => x.grup);
}

/** Öğrencinin sınıfına ait aktif dokümanlar. */
export async function listDocumentsForGrade(grade: number): Promise<DocumentWithGrades[]> {
  return prisma.document.findMany({
    where: { isActive: true, grades: { some: { gradeLevel: grade } } },
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllDocuments(): Promise<DocumentWithGrades[]> {
  return prisma.document.findMany({
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocument(id: string): Promise<DocumentWithGrades | null> {
  return prisma.document.findUnique({ where: { id }, include: withGrades });
}

export type SaveDocumentInput = {
  title: string;
  description: string | null;
  r2Key: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  /** Sınıf → o sınıftaki klasör (null = klasörsüz). */
  grades: Array<{ gradeLevel: Grade; folderId: string | null }>;
};

export async function createDocument(input: SaveDocumentInput): Promise<Document> {
  return prisma.document.create({
    data: {
      title: input.title,
      description: input.description,
      r2Key: input.r2Key,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      grades: {
        create: input.grades.map(({ gradeLevel, folderId }) => ({
          gradeLevel,
          folderId,
        })),
      },
    },
  });
}

export async function updateDocumentMeta(
  id: string,
  input: {
    title: string;
    description: string | null;
    grades: Array<{ gradeLevel: Grade; folderId: string | null }>;
    isActive: boolean;
  },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.documentGrade.deleteMany({ where: { documentId: id } });
    await tx.document.update({
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
}

/** Dokümanı ve R2'deki dosyasını siler. */
export async function deleteDocument(id: string): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: { r2Key: true },
  });

  await prisma.document.delete({ where: { id } });

  if (doc) {
    // r2Key "docs/<id>/dosya.pdf" gibidir; klasörü "docs/<id>/" olarak al.
    const prefixMatch = doc.r2Key.match(/^(docs\/[a-z0-9]+\/)/);
    const prefix = prefixMatch?.[1];
    if (prefix && isDocumentPrefix(prefix)) {
      await deleteDocPrefix(prefix).catch((error) => {
        console.error("R2 doküman temizliği başarısız:", prefix, error);
      });
    }
  }
}

/** Genel panel için sınıf başına doküman sayısı. */
export async function countDocumentsByGrade(): Promise<Record<number, number>> {
  const rows = await prisma.documentGrade.groupBy({
    by: ["gradeLevel"],
    _count: { _all: true },
    where: { document: { isActive: true } },
  });
  const counts: Record<number, number> = Object.fromEntries(
    GRADES.map((g) => [g, 0]),
  );
  for (const row of rows) {
    counts[row.gradeLevel] = row._count._all;
  }
  return counts;
}

export { docTypeLabel, formatFileSize } from "@/lib/utils";
