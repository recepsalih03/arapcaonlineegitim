import "server-only";

import type { Grade } from "@/lib/constants";
import { GRADES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  generateTemporaryPassword,
  generateTemporaryUsername,
  hashPassword,
} from "@/modules/auth/password";

/** Öğrenci yönetimi (PROJE.md §4, §7 "Öğrenci yönetimi"). */

export type StudentRow = {
  id: string;
  username: string;
  fullName: string | null;
  gradeLevel: number | null;
  isActive: boolean;
  mustChangeCredentials: boolean;
  initialPassword: string | null;
  createdAt: Date;
  activeDeviceCount: number;
};

export async function listStudents(grade?: number): Promise<StudentRow[]> {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", ...(grade ? { gradeLevel: grade } : {}) },
    orderBy: [{ gradeLevel: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      fullName: true,
      gradeLevel: true,
      isActive: true,
      mustChangeCredentials: true,
      initialPassword: true,
      createdAt: true,
      _count: { select: { devices: { where: { isActive: true } } } },
    },
  });

  return students.map(({ _count, ...student }) => ({
    ...student,
    activeDeviceCount: _count.devices,
  }));
}

export async function countStudentsByGrade(): Promise<Record<number, number>> {
  const rows = await prisma.user.groupBy({
    by: ["gradeLevel"],
    where: { role: "STUDENT", isActive: true },
    _count: { _all: true },
  });
  const counts: Record<number, number> = Object.fromEntries(
    GRADES.map((g) => [g, 0]),
  );
  for (const row of rows) {
    if (row.gradeLevel !== null) counts[row.gradeLevel] = row._count._all;
  }
  return counts;
}

export type CreatedStudent = {
  id: string;
  username: string;
  temporaryPassword: string;
};

/**
 * Yeni öğrenci oluşturur (PROJE.md §4a): sistem geçici kullanıcı adı ve şifre
 * üretir, admin bunları öğrenciye iletir. Öğrenci ilk girişte ikisini de
 * değiştirmek zorundadır (mustChangeCredentials = true).
 */
export async function createStudent(input: {
  gradeLevel: Grade;
  fullName: string | null;
}): Promise<CreatedStudent> {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  // Çok düşük ihtimalli kullanıcı adı çakışmasına karşı birkaç deneme.
  for (let attempt = 0; attempt < 8; attempt++) {
    const username = generateTemporaryUsername(input.gradeLevel);
    const clash = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (clash) continue;

    const student = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "STUDENT",
        gradeLevel: input.gradeLevel,
        fullName: input.fullName,
        mustChangeCredentials: true,
        // Admin panelde tekrar görebilsin diye; öğrenci değiştirince silinir.
        initialPassword: temporaryPassword,
      },
      select: { id: true, username: true },
    });

    return { ...student, temporaryPassword };
  }

  throw new Error("Kullanıcı adı üretilemedi, lütfen tekrar deneyin.");
}

/** Pasife alma (PROJE.md §4d). Pasif öğrenci giriş yapamaz. */
export async function setStudentActive(
  studentId: string,
  isActive: boolean,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: studentId },
      data: { isActive },
    });
    // Pasife alınan öğrencinin açık oturumları da düşürülür.
    if (!isActive) {
      await tx.deviceSession.updateMany({
        where: { userId: studentId },
        data: { isActive: false },
      });
    }
  });
}

export async function deleteStudent(studentId: string): Promise<void> {
  // Cihazlar ve anket katılımları onDelete: Cascade ile birlikte silinir.
  // Anket OYLARI silinmez — zaten kullanıcıya bağlı olmadıkları için silinemez
  // de; anonimlik bunu gerektirir.
  await prisma.user.delete({ where: { id: studentId } });
}

/** Adminin öğrenciye yeni geçici şifre vermesi (şifresini unutan öğrenci için). */
export async function resetStudentPassword(
  studentId: string,
): Promise<{ temporaryPassword: string }> {
  const temporaryPassword = generateTemporaryPassword();
  await prisma.user.update({
    where: { id: studentId },
    data: {
      passwordHash: await hashPassword(temporaryPassword),
      // Şifre yeniden geçici olduğu için ilk-giriş akışı tekrar zorunlu olur.
      mustChangeCredentials: true,
      initialPassword: temporaryPassword,
    },
  });
  return { temporaryPassword };
}

export async function getStudent(studentId: string) {
  return prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    include: {
      devices: {
        where: { isActive: true },
        orderBy: { lastSeenAt: "desc" },
      },
    },
  });
}
