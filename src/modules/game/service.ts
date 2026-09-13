import "server-only";

import type { Game } from "@/generated/prisma/client";
import type { GameType } from "@/generated/prisma/enums";
import type { Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/** Oyun modülü: alıştırma oyunlarının listelenmesi ve yönetimi. */

export type GameWithGrades = Game & { grades: { gradeLevel: number }[] };

const withGrades = {
  grades: { select: { gradeLevel: true }, orderBy: { gradeLevel: "asc" } },
} as const;

export async function listGamesForGrade(grade: number): Promise<GameWithGrades[]> {
  return prisma.game.findMany({
    where: { isActive: true, grades: { some: { gradeLevel: grade } } },
    include: withGrades,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function listAllGames(grade?: number): Promise<GameWithGrades[]> {
  return prisma.game.findMany({
    where: grade ? { grades: { some: { gradeLevel: grade } } } : undefined,
    include: withGrades,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getGame(id: string): Promise<GameWithGrades | null> {
  return prisma.game.findUnique({ where: { id }, include: withGrades });
}

/**
 * Girişsiz erişilen public oyun sayfaları için: sınıf ayrımı yapmadan tüm
 * AKTİF oyunlar. Şu an tüm oyunlar herkese açık (bkz. /oyunlar route'u).
 */
export async function listActiveGames(): Promise<GameWithGrades[]> {
  return prisma.game.findMany({
    where: { isActive: true },
    include: withGrades,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

/** Public oyun oynama sayfası için: aktifse getir, değilse null (404). */
export async function getActiveGame(id: string): Promise<GameWithGrades | null> {
  return prisma.game.findFirst({ where: { id, isActive: true }, include: withGrades });
}

/** Öğrenci yalnızca kendi sınıfının aktif oyununu açabilir. */
export async function getGameForGrade(
  id: string,
  grade: number,
): Promise<GameWithGrades | null> {
  return prisma.game.findFirst({
    where: { id, isActive: true, grades: { some: { gradeLevel: grade } } },
    include: withGrades,
  });
}

export type SaveGameInput = {
  title: string;
  description: string | null;
  type: GameType;
  content: unknown;
  isArabic: boolean;
  grades: Grade[];
};

export async function createGame(input: SaveGameInput): Promise<Game> {
  const sonuncu = await prisma.game.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.game.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      content: input.content as never,
      isArabic: input.isArabic,
      sortOrder: (sonuncu?.sortOrder ?? 0) + 1,
      grades: { create: input.grades.map((gradeLevel) => ({ gradeLevel })) },
    },
  });
}

export async function updateGame(
  id: string,
  input: SaveGameInput & { isActive: boolean },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.gameGrade.deleteMany({ where: { gameId: id } });
    await tx.game.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        // Tür değiştirilemez (form da göstermez): içerik şekli türe bağlı,
        // değiştirilse kayıtlı içerik anlamsızlaşırdı.
        content: input.content as never,
        isArabic: input.isArabic,
        isActive: input.isActive,
        grades: { create: input.grades.map((gradeLevel) => ({ gradeLevel })) },
      },
    });
  });
}

export async function deleteGame(id: string): Promise<void> {
  await prisma.game.delete({ where: { id } });
}

export async function countGamesByGrade(): Promise<Record<number, number>> {
  const rows = await prisma.gameGrade.groupBy({
    by: ["gradeLevel"],
    _count: { _all: true },
    where: { game: { isActive: true } },
  });
  const counts: Record<number, number> = {};
  for (const row of rows) counts[row.gradeLevel] = row._count._all;
  return counts;
}
