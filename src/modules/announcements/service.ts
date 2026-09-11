import "server-only";

import type { Announcement } from "@/generated/prisma/client";
import type { Grade } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/** Duyuru modülü (PROJE.md §7 "Duyuru paneli"). */

export type AnnouncementWithGrades = Announcement & {
  grades: { gradeLevel: number }[];
};

const withGrades = {
  grades: { select: { gradeLevel: true }, orderBy: { gradeLevel: "asc" } },
} as const;

/**
 * Yayın penceresi süzgeci.
 *
 * startsAt boşsa "hemen başlamış", endsAt boşsa "süresiz" sayılır. Böylece
 * tarih vermeyen duyurular eskisi gibi davranmaya devam eder.
 */
function yayindaKosulu(now: Date = new Date()) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

/** Bir duyurunun şu an öğrenciye görünüp görünmediği (panelde rozet için). */
export function yayindaMi(
  announcement: Pick<Announcement, "isActive" | "startsAt" | "endsAt">,
  now: Date = new Date(),
): boolean {
  if (!announcement.isActive) return false;
  if (announcement.startsAt && announcement.startsAt > now) return false;
  if (announcement.endsAt && announcement.endsAt < now) return false;
  return true;
}

/** Öğrencinin kendi sınıfına düşen, şu an yayında olan duyurular. */
export async function listAnnouncementsForGrade(
  grade: number,
): Promise<AnnouncementWithGrades[]> {
  return prisma.announcement.findMany({
    where: {
      ...yayindaKosulu(),
      grades: { some: { gradeLevel: grade } },
    },
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllAnnouncements(
  grade?: number,
): Promise<AnnouncementWithGrades[]> {
  return prisma.announcement.findMany({
    where: grade ? { grades: { some: { gradeLevel: grade } } } : undefined,
    include: withGrades,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAnnouncement(
  id: string,
): Promise<AnnouncementWithGrades | null> {
  return prisma.announcement.findUnique({ where: { id }, include: withGrades });
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  grades: Grade[];
  startsAt: Date | null;
  endsAt: Date | null;
}): Promise<Announcement> {
  return prisma.announcement.create({
    data: {
      title: input.title,
      body: input.body,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      grades: { create: input.grades.map((gradeLevel) => ({ gradeLevel })) },
    },
  });
}

export async function updateAnnouncement(
  id: string,
  input: {
    title: string;
    body: string;
    grades: Grade[];
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.announcementGrade.deleteMany({ where: { announcementId: id } });
    await tx.announcement.update({
      where: { id },
      data: {
        title: input.title,
        body: input.body,
        isActive: input.isActive,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        grades: { create: input.grades.map((gradeLevel) => ({ gradeLevel })) },
      },
    });
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await prisma.announcement.delete({ where: { id } });
}
