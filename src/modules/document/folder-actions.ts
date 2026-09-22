"use server";

import { type ActionState, readText } from "@/lib/forms";
import { parseGrade } from "@/lib/constants";
import { tazeleDocKlasorler } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import {
  createDocFolder,
  deleteDocFolder,
  moveDocFolder,
  renameDocFolder,
} from "@/modules/document/folders";

/** Doküman klasör yönetimi server action'ları. */

export async function createDocFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = readText(formData, "name");
  const grade = parseGrade(readText(formData, "grade"));
  if (!grade) return { error: "Geçersiz sınıf." };
  if (name.length < 1) return { error: "Klasör adı boş olamaz." };

  await createDocFolder(grade, name);
  tazeleDocKlasorler(grade);
  return { success: "Klasör oluşturuldu." };
}

export async function renameDocFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "folderId");
  const name = readText(formData, "name");
  if (!id) return { error: "Klasör bulunamadı." };
  if (name.length < 1) return { error: "Klasör adı boş olamaz." };

  await renameDocFolder(id, name);
  tazeleDocKlasorler();
  return { success: "Klasör yeniden adlandırıldı." };
}

export async function deleteDocFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "folderId");
  if (!id) return { error: "Klasör bulunamadı." };

  await deleteDocFolder(id);
  tazeleDocKlasorler();
  return { success: "Klasör silindi. İçindeki dokümanlar 'Diğer' altına taşındı." };
}

export async function moveDocFolderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "folderId");
  const yon = readText(formData, "yon") as "yukari" | "asagi";
  if (!id) return { error: "Klasör bulunamadı." };
  if (yon !== "yukari" && yon !== "asagi") return { error: "Geçersiz yön." };

  await moveDocFolder(id, yon);
  tazeleDocKlasorler();
  return { success: "Klasör sırası güncellendi." };
}
