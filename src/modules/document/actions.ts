"use server";

import { redirect } from "next/navigation";

import {
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_PREFIX_PATTERN,
} from "@/lib/constants";
import {
  type ActionState,
  readBoolean,
  readGrades,
  readOptionalText,
  readText,
} from "@/lib/forms";
import { tazeleDokumanlar } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import { normalizeDocFolderSelection } from "@/modules/document/folders";
import {
  createDocument,
  deleteDocument,
  updateDocumentMeta,
} from "@/modules/document/service";

/** Doküman yönetimi server action'ları. */

export async function createDocumentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const title = readText(formData, "title");
  if (title.length < 2) return { error: "Doküman başlığı en az 2 karakter olmalı." };

  const grades = readGrades(formData);
  if (grades.length === 0) {
    return { error: "En az bir sınıf seviyesi seçmelisiniz." };
  }

  const r2Key = readText(formData, "r2Key");
  if (!r2Key || !DOCUMENT_PREFIX_PATTERN.test(r2Key.replace(/[^/]+$/, ""))) {
    return { error: "Yükleme tamamlanmamış. Önce dosyayı yükleyin." };
  }

  const fileName = readText(formData, "fileName");
  const mimeType = readText(formData, "mimeType");
  const fileSize = Number.parseInt(readText(formData, "fileSize"), 10);

  if (!fileName) return { error: "Dosya adı eksik." };
  if (!mimeType || !ALLOWED_DOCUMENT_TYPES[mimeType]) {
    return { error: "Desteklenmeyen dosya türü." };
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { error: "Dosya boyutu geçersiz." };
  }

  const klasorler = await normalizeDocFolderSelection(
    grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: readOptionalText(formData, `folder-${gradeLevel}`),
    })),
  );

  await createDocument({
    title,
    description: readOptionalText(formData, "description"),
    r2Key,
    fileName,
    mimeType,
    fileSize,
    grades: grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: klasorler.get(gradeLevel) ?? null,
    })),
  });

  tazeleDokumanlar(grades);
  redirect(`/yonetim/dokumanlar?eklendi=${encodeURIComponent(title)}`);
}

export async function updateDocumentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "documentId");
  const title = readText(formData, "title");
  if (!id) return { error: "Doküman bulunamadı." };
  if (title.length < 2) return { error: "Doküman başlığı en az 2 karakter olmalı." };

  const grades = readGrades(formData);
  if (grades.length === 0) {
    return { error: "En az bir sınıf seviyesi seçmelisiniz." };
  }

  const klasorler = await normalizeDocFolderSelection(
    grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: readOptionalText(formData, `folder-${gradeLevel}`),
    })),
  );

  await updateDocumentMeta(id, {
    title,
    description: readOptionalText(formData, "description"),
    grades: grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: klasorler.get(gradeLevel) ?? null,
    })),
    isActive: readBoolean(formData, "isActive"),
  });

  tazeleDokumanlar(grades);
  return { success: "Doküman güncellendi." };
}

export async function deleteDocumentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "documentId");
  if (!id) return { error: "Doküman bulunamadı." };

  await deleteDocument(id);
  tazeleDokumanlar();

  const redirectTo = readOptionalText(formData, "redirect");
  if (redirectTo) {
    redirect(redirectTo);
  }

  return { success: "Doküman ve dosyası silindi." };
}
