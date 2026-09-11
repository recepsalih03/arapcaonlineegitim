import "server-only";

import type { Survey } from "@/generated/prisma/client";
import type { Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "@/lib/utils";

/**
 * Anket modülü (PROJE.md §7 "Anket paneli").
 *
 * ANONİMLİK KURALI — bu dosyanın en önemli kısmı:
 *   - Oy kaydı (SurveyVote) kullanıcıya ait HİÇBİR alan taşımaz.
 *   - Kimin oy verdiği ayrı bir tabloda (SurveyParticipation) tutulur; orada da
 *     oyun İÇERİĞİ yoktur — yalnızca "oy verdi" işareti.
 *   - İki tablodaki zaman damgaları GÜN hassasiyetine yuvarlanır; aksi hâlde
 *     milisaniye eşleşmesinden kimin ne oyladığı geri çıkarılabilirdi.
 *   - Sonuçları yalnızca admin görür.
 */

export type SurveyWithGrades = Survey & { grades: { gradeLevel: number }[] };

const withGrades = {
  grades: { select: { gradeLevel: true }, orderBy: { gradeLevel: "asc" } },
} as const;

export function surveyOptions(survey: Survey): string[] {
  const raw = survey.options;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

export async function listSurveysForGrade(grade: number): Promise<
  Array<SurveyWithGrades & { hasVoted: boolean }>
> {
  const surveys = await prisma.survey.findMany({
    where: { isActive: true, grades: { some: { gradeLevel: grade } } },
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
  return surveys.map((survey) => ({ ...survey, hasVoted: false }));
}

/** Öğrenci görünümü: hangi anketlere oy verdiği işaretlenir (oy içeriği değil). */
export async function listSurveysForStudent(
  userId: string,
  grade: number,
): Promise<Array<SurveyWithGrades & { hasVoted: boolean }>> {
  const [surveys, participations] = await Promise.all([
    prisma.survey.findMany({
      where: { isActive: true, grades: { some: { gradeLevel: grade } } },
      include: withGrades,
      orderBy: { createdAt: "desc" },
    }),
    prisma.surveyParticipation.findMany({
      where: { userId },
      select: { surveyId: true },
    }),
  ]);

  const voted = new Set(participations.map((p) => p.surveyId));
  return surveys.map((survey) => ({
    ...survey,
    hasVoted: voted.has(survey.id),
  }));
}

export async function listAllSurveys(grade?: number): Promise<SurveyWithGrades[]> {
  return prisma.survey.findMany({
    where: grade ? { grades: { some: { gradeLevel: grade } } } : undefined,
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSurvey(id: string): Promise<SurveyWithGrades | null> {
  return prisma.survey.findUnique({ where: { id }, include: withGrades });
}

export type SurveyResults = {
  totalVotes: number;
  options: Array<{ index: number; label: string; count: number; ratio: number }>;
};

/** Yalnızca admin panelinde kullanılır (PROJE.md §7: sonuçları sadece admin görür). */
export async function getSurveyResults(surveyId: string): Promise<SurveyResults | null> {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) return null;

  const labels = surveyOptions(survey);
  const grouped = await prisma.surveyVote.groupBy({
    by: ["optionIndex"],
    where: { surveyId },
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((row) => [row.optionIndex, row._count._all]));
  const totalVotes = grouped.reduce((sum, row) => sum + row._count._all, 0);

  return {
    totalVotes,
    options: labels.map((label, index) => {
      const count = counts.get(index) ?? 0;
      return {
        index,
        label,
        count,
        ratio: totalVotes === 0 ? 0 : count / totalVotes,
      };
    }),
  };
}

export async function createSurvey(input: {
  question: string;
  options: string[];
  grades: Grade[];
}): Promise<Survey> {
  return prisma.survey.create({
    data: {
      question: input.question,
      options: input.options,
      grades: { create: input.grades.map((gradeLevel) => ({ gradeLevel })) },
    },
  });
}

export async function updateSurvey(
  id: string,
  input: { question: string; grades: Grade[]; isActive: boolean },
): Promise<void> {
  // Seçenekler bilerek değiştirilemez: mevcut oylar optionIndex'e bağlı,
  // seçenek sırası değişirse geçmiş oylar anlamsızlaşır.
  await prisma.$transaction(async (tx) => {
    await tx.surveyGrade.deleteMany({ where: { surveyId: id } });
    await tx.survey.update({
      where: { id },
      data: {
        question: input.question,
        isActive: input.isActive,
        grades: { create: input.grades.map((gradeLevel) => ({ gradeLevel })) },
      },
    });
  });
}

export async function deleteSurvey(id: string): Promise<void> {
  await prisma.survey.delete({ where: { id } });
}

export type VoteResult =
  | { ok: true }
  | { ok: false; reason: "already_voted" | "not_allowed" | "invalid_option" };

/**
 * Anonim oy verme. Oy ile kullanıcı arasında hiçbir yerde bağ kurulmaz;
 * ikisi aynı işlemde ama ayrı tablolara, gün hassasiyetli tarihle yazılır.
 */
export async function castVote(params: {
  surveyId: string;
  userId: string;
  gradeLevel: number;
  optionIndex: number;
}): Promise<VoteResult> {
  const { surveyId, userId, gradeLevel, optionIndex } = params;

  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      isActive: true,
      grades: { some: { gradeLevel } },
    },
  });
  if (!survey) return { ok: false, reason: "not_allowed" };

  const options = surveyOptions(survey);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
    return { ok: false, reason: "invalid_option" };
  }

  const votedOn = startOfDayUTC();

  try {
    await prisma.$transaction([
      // Bu satır kullanıcıyı işaretler ama NE oyladığını tutmaz.
      prisma.surveyParticipation.create({
        data: { surveyId, userId, votedOn },
      }),
      // Bu satır oyu tutar ama KİMİN verdiğini tutmaz.
      prisma.surveyVote.create({
        data: { surveyId, optionIndex, votedOn },
      }),
    ]);
  } catch {
    // Bileşik birincil anahtar (surveyId,userId) ikinci oyu engeller.
    return { ok: false, reason: "already_voted" };
  }

  return { ok: true };
}
