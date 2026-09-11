"use server";


import {
  type ActionState,
  readBoolean,
  readDateTime,
  readGrades,
  readText,
} from "@/lib/forms";
import { tazeleDuyurular } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/modules/announcements/service";

/** Duyuru yönetimi server action'ları (PROJE.md §7 "Duyuru paneli"). */


export async function createAnnouncementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const title = readText(formData, "title");
  const body = readText(formData, "body");
  const grades = readGrades(formData);

  if (title.length < 2) return { error: "Duyuru başlığı en az 2 karakter olmalı." };
  if (body.length < 2) return { error: "Duyuru metni boş olamaz." };
  if (grades.length === 0) return { error: "En az bir sınıf seviyesi seçmelisiniz." };

  const startsAt = readDateTime(formData, "startsAt");
  const endsAt = readDateTime(formData, "endsAt");
  if (startsAt && endsAt && endsAt <= startsAt) {
    return { error: "Bitiş tarihi başlangıçtan sonra olmalı." };
  }

  await createAnnouncement({ title, body, grades, startsAt, endsAt });
  tazeleDuyurular(grades);
  return { success: "Duyuru yayınlandı." };
}

export async function updateAnnouncementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "announcementId");
  const title = readText(formData, "title");
  const body = readText(formData, "body");
  const grades = readGrades(formData);

  if (!id) return { error: "Duyuru bulunamadı." };
  if (title.length < 2) return { error: "Duyuru başlığı en az 2 karakter olmalı." };
  if (body.length < 2) return { error: "Duyuru metni boş olamaz." };
  if (grades.length === 0) return { error: "En az bir sınıf seviyesi seçmelisiniz." };

  const startsAt = readDateTime(formData, "startsAt");
  const endsAt = readDateTime(formData, "endsAt");
  if (startsAt && endsAt && endsAt <= startsAt) {
    return { error: "Bitiş tarihi başlangıçtan sonra olmalı." };
  }

  await updateAnnouncement(id, {
    title,
    body,
    grades,
    isActive: readBoolean(formData, "isActive"),
    startsAt,
    endsAt,
  });
  tazeleDuyurular(grades);
  return { success: "Duyuru güncellendi." };
}

export async function deleteAnnouncementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "announcementId");
  if (!id) return { error: "Duyuru bulunamadı." };

  await deleteAnnouncement(id);
  tazeleDuyurular();
  return { success: "Duyuru silindi." };
}
