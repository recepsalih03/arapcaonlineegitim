"use server";


import { parseGrade } from "@/lib/constants";
import { type ActionState, readText } from "@/lib/forms";
import { tazeleKlasorler } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import {
  createFolder,
  deleteFolder,
  moveFolder,
  renameFolder,
} from "@/modules/video/folders";


export async function createFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const grade = parseGrade(readText(formData, "gradeLevel"));
  if (!grade) return { error: "Geçerli bir sınıf seçilmedi." };

  const name = readText(formData, "name");
  if (name.length < 2) return { error: "Klasör adı en az 2 karakter olmalı." };
  if (name.length > 60) return { error: "Klasör adı en fazla 60 karakter olabilir." };

  await createFolder(grade, name);
  tazeleKlasorler(grade);
  return { success: "Klasör oluşturuldu." };
}

export async function renameFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "folderId");
  const name = readText(formData, "name");
  if (!id) return { error: "Klasör bulunamadı." };
  if (name.length < 2) return { error: "Klasör adı en az 2 karakter olmalı." };

  await renameFolder(id, name);
  tazeleKlasorler(parseGrade(readText(formData, "gradeLevel")));
  return { success: "Klasör adı değiştirildi." };
}

export async function deleteFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "folderId");
  if (!id) return { error: "Klasör bulunamadı." };

  await deleteFolder(id);
  tazeleKlasorler(parseGrade(readText(formData, "gradeLevel")));
  return { success: "Klasör silindi. İçindeki videolar duruyor." };
}

export async function moveFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "folderId");
  const yon = readText(formData, "yon");
  if (!id || (yon !== "yukari" && yon !== "asagi")) {
    return { error: "Geçersiz işlem." };
  }

  await moveFolder(id, yon);
  tazeleKlasorler(parseGrade(readText(formData, "gradeLevel")));
  return {};
}
