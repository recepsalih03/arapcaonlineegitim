"use server";


import { parseGrade } from "@/lib/constants";
import {
  type ActionState,
  readOptionalText,
  readText,
} from "@/lib/forms";
import { tazeleOgrenciler } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import { resetAllDevices, removeDevice } from "@/modules/devices/service";
import {
  createStudent,
  deleteStudent,
  resetStudentPassword,
  setStudentActive,
} from "@/modules/students/service";

/** Öğrenci yönetimi server action'ları — hepsi admin yetkisi ister. */


export async function createStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const grade = parseGrade(readText(formData, "gradeLevel"));
  if (!grade) return { error: "Geçerli bir sınıf seçin." };

  const fullName = readOptionalText(formData, "fullName");

  try {
    const student = await createStudent({ gradeLevel: grade, fullName });
    tazeleOgrenciler(grade);
    return {
      success: "Öğrenci oluşturuldu. Bilgileri öğrenciye iletin.",
      data: {
        username: student.username,
        password: student.temporaryPassword,
      },
    };
  } catch (error) {
    console.error(error);
    return { error: "Öğrenci oluşturulamadı. Lütfen tekrar deneyin." };
  }
}

export async function setStudentActiveAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const studentId = readText(formData, "studentId");
  const isActive = readText(formData, "isActive") === "true";
  if (!studentId) return { error: "Öğrenci bulunamadı." };

  await setStudentActive(studentId, isActive);
  tazeleOgrenciler(parseGrade(readText(formData, "gradeLevel")));
  return {
    success: isActive ? "Öğrenci tekrar aktif." : "Öğrenci pasife alındı.",
  };
}

export async function deleteStudentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const studentId = readText(formData, "studentId");
  if (!studentId) return { error: "Öğrenci bulunamadı." };

  await deleteStudent(studentId);
  tazeleOgrenciler(parseGrade(readText(formData, "gradeLevel")));
  return { success: "Öğrenci silindi." };
}

export async function resetStudentPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const studentId = readText(formData, "studentId");
  if (!studentId) return { error: "Öğrenci bulunamadı." };

  const { temporaryPassword } = await resetStudentPassword(studentId);
  tazeleOgrenciler(parseGrade(readText(formData, "gradeLevel")));
  return {
    success: "Yeni geçici şifre üretildi. Öğrenci ilk girişte değiştirecek.",
    data: { password: temporaryPassword },
  };
}

/**
 * Destek amaçlı toplu cihaz sıfırlama. Parmak izi kayması yüzünden 4 cihaz
 * limitine takılan öğrenciyi kurtarmak için (PROJE.md §12.2 kararı).
 */
export async function resetStudentDevicesAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const studentId = readText(formData, "studentId");
  if (!studentId) return { error: "Öğrenci bulunamadı." };

  const count = await resetAllDevices(studentId);
  tazeleOgrenciler(parseGrade(readText(formData, "gradeLevel")));
  return {
    success:
      count === 0
        ? "Bu öğrencinin kayıtlı cihazı yoktu."
        : `${count} cihaz kaydı silindi. Öğrenci yeniden giriş yapabilir.`,
  };
}

/** Adminin öğrencinin tek bir cihazını düşürmesi. */
export async function removeStudentDeviceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const studentId = readText(formData, "studentId");
  const deviceSessionId = readText(formData, "deviceSessionId");
  if (!studentId || !deviceSessionId) return { error: "Cihaz bulunamadı." };

  const result = await removeDevice({
    userId: studentId,
    deviceSessionId,
    currentDeviceSessionId: null,
  });
  if (!result.ok) return { error: "Cihaz bulunamadı." };

  tazeleOgrenciler(null);
  return { success: "Cihaz silindi." };
}
