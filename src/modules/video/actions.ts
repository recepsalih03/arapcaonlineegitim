"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { VIDEO_PREFIX_PATTERN } from "@/lib/constants";
import {
  type ActionState,
  readBoolean,
  readGrades,
  readOptionalText,
  readText,
} from "@/lib/forms";
import { listKeys } from "@/lib/r2";
import { tazeleVideolar } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import { normalizeFolderSelection } from "@/modules/video/folders";
import {
  createVideo,
  deleteVideo,
  setVideoPublic,
  updateVideoMeta,
} from "@/modules/video/service";

/** Video yönetimi server action'ları (PROJE.md §7 "Video yönetimi"). */


const prefixSchema = z.string().regex(VIDEO_PREFIX_PATTERN);
const playlistSchema = z
  .string()
  .regex(/^[A-Za-z0-9._-]+\.m3u8$/, "Playlist dosyası .m3u8 olmalı.");

export async function createVideoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const title = readText(formData, "title");
  if (title.length < 2) return { error: "Video başlığı en az 2 karakter olmalı." };

  const grades = readGrades(formData);
  if (grades.length === 0) {
    return { error: "En az bir sınıf seviyesi seçmelisiniz." };
  }

  const prefixParse = prefixSchema.safeParse(readText(formData, "hlsPrefix"));
  if (!prefixParse.success) {
    return { error: "Yükleme tamamlanmamış. Önce video klasörünü yükleyin." };
  }

  const playlistParse = playlistSchema.safeParse(
    readText(formData, "playlistName") || "master.m3u8",
  );
  if (!playlistParse.success) {
    return { error: playlistParse.error.issues[0].message };
  }

  const prefix = prefixParse.data;
  const playlistName = playlistParse.data;

  // Yüklemenin gerçekten tamamlandığını R2'den doğrula: playlist yoksa
  // oynatılamayan bir kayıt oluşturmanın anlamı yok.
  const keys = await listKeys(prefix);
  if (!keys.includes(`${prefix}${playlistName}`)) {
    return {
      error: `Yüklenen klasörde "${playlistName}" bulunamadı. ffmpeg çıktısındaki playlist adını kontrol edin.`,
    };
  }

  // Her sınıf için ayrı klasör alanı gelir: folder-5, folder-6…
  const klasorler = await normalizeFolderSelection(
    grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: readOptionalText(formData, `folder-${gradeLevel}`),
    })),
  );

  const durationRaw = readText(formData, "durationSec");
  const durationSec = durationRaw ? Number.parseInt(durationRaw, 10) : null;

  await createVideo({
    title,
    description: readOptionalText(formData, "description"),
    hlsPrefix: prefix,
    playlistName,
    posterKey: readOptionalText(formData, "posterKey"),
    durationSec: Number.isFinite(durationSec) ? durationSec : null,
    grades: grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: klasorler.get(gradeLevel) ?? null,
    })),
  });

  tazeleVideolar(grades);
  // Formda kalmak yanıltıcıydı: yükleme bitti mi, kayıt oldu mu belli olmuyordu.
  // Listeye götürüp orada onay gösteriyoruz.
  redirect(`/yonetim/videolar?eklendi=${encodeURIComponent(title)}`);
}

export async function updateVideoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "videoId");
  const title = readText(formData, "title");
  if (!id) return { error: "Video bulunamadı." };
  if (title.length < 2) return { error: "Video başlığı en az 2 karakter olmalı." };

  const grades = readGrades(formData);
  if (grades.length === 0) {
    return { error: "En az bir sınıf seviyesi seçmelisiniz." };
  }

  const klasorler = await normalizeFolderSelection(
    grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: readOptionalText(formData, `folder-${gradeLevel}`),
    })),
  );

  await updateVideoMeta(id, {
    title,
    description: readOptionalText(formData, "description"),
    grades: grades.map((gradeLevel) => ({
      gradeLevel,
      folderId: klasorler.get(gradeLevel) ?? null,
    })),
    isActive: readBoolean(formData, "isActive"),
  });

  tazeleVideolar(grades);
  return { success: "Video güncellendi." };
}

/**
 * Public işaretini değiştirir. Sınıf başına 1 public video kuralı servis
 * katmanında zorlanır: aynı sınıfı paylaşan eski public video otomatik düşer.
 */
export async function toggleVideoPublicAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "videoId");
  const makePublic = readText(formData, "isPublic") === "true";
  if (!id) return { error: "Video bulunamadı." };

  const { publicSlug } = await setVideoPublic(id, makePublic);

  tazeleVideolar();
  return {
    success: makePublic
      ? "Video artık herkese açık. Aynı sınıftaki önceki public video otomatik olarak kaldırıldı."
      : "Videonun herkese açık erişimi kapatıldı.",
    data: publicSlug ? { slug: publicSlug } : undefined,
  };
}

export async function deleteVideoAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "videoId");
  if (!id) return { error: "Video bulunamadı." };

  await deleteVideo(id);
  tazeleVideolar();
  return { success: "Video ve dosyaları silindi." };
}
