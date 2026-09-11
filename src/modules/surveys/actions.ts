"use server";


import {
  type ActionState,
  readBoolean,
  readGrades,
  readText,
} from "@/lib/forms";
import { tazeleAnketler } from "@/lib/revalidate";
import { requireAdmin, requireStudent } from "@/modules/auth/session";
import {
  castVote,
  createSurvey,
  deleteSurvey,
  updateSurvey,
} from "@/modules/surveys/service";

/** Anket yönetimi ve oy verme (PROJE.md §7 "Anket paneli"). */


const MAX_OPTIONS = 8;

export async function createSurveyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const question = readText(formData, "question");
  const grades = readGrades(formData);
  const options = formData
    .getAll("options")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)
    .slice(0, MAX_OPTIONS);

  if (question.length < 2) return { error: "Anket sorusu en az 2 karakter olmalı." };
  if (options.length < 2) return { error: "En az iki seçenek girmelisiniz." };
  if (new Set(options).size !== options.length) {
    return { error: "Seçenekler birbirinden farklı olmalı." };
  }
  if (grades.length === 0) return { error: "En az bir sınıf seviyesi seçmelisiniz." };

  await createSurvey({ question, options, grades });
  tazeleAnketler(grades);
  return { success: "Anket yayınlandı." };
}

export async function updateSurveyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "surveyId");
  const question = readText(formData, "question");
  const grades = readGrades(formData);

  if (!id) return { error: "Anket bulunamadı." };
  if (question.length < 2) return { error: "Anket sorusu en az 2 karakter olmalı." };
  if (grades.length === 0) return { error: "En az bir sınıf seviyesi seçmelisiniz." };

  // Seçenekler değiştirilemez: mevcut oylar seçenek sırasına bağlı.
  await updateSurvey(id, {
    question,
    grades,
    isActive: readBoolean(formData, "isActive"),
  });
  tazeleAnketler(grades);
  return { success: "Anket güncellendi." };
}

export async function deleteSurveyAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "surveyId");
  if (!id) return { error: "Anket bulunamadı." };

  await deleteSurvey(id);
  tazeleAnketler();
  return { success: "Anket ve oyları silindi." };
}

/**
 * Öğrencinin oy vermesi. Oy anonimdir: bu action'dan sonra bile "bu öğrenci ne
 * oyladı" sorusunun cevabı veritabanında bulunmaz (bkz. surveys/service.ts).
 */
export async function voteAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const student = await requireStudent();

  const surveyId = readText(formData, "surveyId");
  const optionIndex = Number.parseInt(readText(formData, "optionIndex"), 10);
  if (!surveyId || !Number.isInteger(optionIndex)) {
    return { error: "Bir seçenek işaretleyin." };
  }

  const result = await castVote({
    surveyId,
    userId: student.id,
    gradeLevel: student.gradeLevel,
    optionIndex,
  });

  if (!result.ok) {
    switch (result.reason) {
      case "already_voted":
        return { error: "Bu ankete zaten oy verdiniz." };
      case "invalid_option":
        return { error: "Geçersiz seçenek." };
      default:
        return { error: "Bu ankete oy veremezsiniz." };
    }
  }

  tazeleAnketler([student.gradeLevel]);
  return { success: "Oyunuz kaydedildi. Teşekkürler!" };
}
