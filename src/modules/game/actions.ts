"use server";

import { redirect } from "next/navigation";

import type { GameType } from "@/generated/prisma/enums";
import {
  type ActionState,
  readBoolean,
  readGrades,
  readOptionalText,
  readText,
} from "@/lib/forms";
import { tazeleOyunlar } from "@/lib/revalidate";
import { requireAdmin } from "@/modules/auth/session";
import { boslukSayisi, icerikSemasi } from "@/modules/game/content";
import { createGame, deleteGame, updateGame } from "@/modules/game/service";

const TURLER: GameType[] = ["BOSLUK", "KART", "ESLESTIRME", "BULMACA"];


/** Form alanlarından türe uygun içeriği kurar ve doğrular. */
function icerikTopla(
  type: GameType,
  formData: FormData,
): { ok: true; content: unknown } | { ok: false; error: string } {
  if (type === "BOSLUK") {
    const metin = readText(formData, "metin");
    if (boslukSayisi(metin) === 0) {
      return {
        ok: false,
        error:
          "En az bir boşluk işaretlemelisiniz. Gizlenecek kelimeyi köşeli parantez içine alın: Bu [kitap] güzel.",
      };
    }
    const parsed = icerikSemasi(type).safeParse({ metin });
    return parsed.success
      ? { ok: true, content: parsed.data }
      : { ok: false, error: "Metin çok kısa veya çok uzun." };
  }

  const sorular = formData.getAll("cift-soru").map((v) => String(v).trim());
  const cevaplar = formData.getAll("cift-cevap").map((v) => String(v).trim());
  const ciftler = sorular
    .map((soru, i) => ({ soru, cevap: cevaplar[i] ?? "" }))
    .filter((c) => c.soru.length > 0 && c.cevap.length > 0);

  if (ciftler.length < 2) {
    return { ok: false, error: "En az iki satır doldurmalısınız." };
  }

  const parsed = icerikSemasi(type).safeParse({ ciftler });
  return parsed.success
    ? { ok: true, content: parsed.data }
    : { ok: false, error: "Satırlardan biri çok uzun." };
}

function ortakDogrula(formData: FormData) {
  const title = readText(formData, "title");
  if (title.length < 2) return { error: "Oyun adı en az 2 karakter olmalı." };

  const grades = readGrades(formData);
  if (grades.length === 0) return { error: "En az bir sınıf seçmelisiniz." };

  return { title, grades };
}

export async function createGameAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const type = readText(formData, "type") as GameType;
  if (!TURLER.includes(type)) return { error: "Geçersiz oyun türü." };

  const ortak = ortakDogrula(formData);
  if ("error" in ortak) return ortak;

  const icerik = icerikTopla(type, formData);
  if (!icerik.ok) return { error: icerik.error };

  await createGame({
    title: ortak.title,
    description: readOptionalText(formData, "description"),
    type,
    content: icerik.content,
    isArabic: readBoolean(formData, "isArabic"),
    grades: ortak.grades,
  });

  tazeleOyunlar(ortak.grades);
  // Video eklemede olduğu gibi: formda kalmak yerine listeye götürüp onay ver.
  redirect(`/yonetim/oyunlar?eklendi=${encodeURIComponent(ortak.title)}`);
}

export async function updateGameAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "gameId");
  const type = readText(formData, "type") as GameType;
  if (!id) return { error: "Oyun bulunamadı." };
  if (!TURLER.includes(type)) return { error: "Geçersiz oyun türü." };

  const ortak = ortakDogrula(formData);
  if ("error" in ortak) return ortak;

  const icerik = icerikTopla(type, formData);
  if (!icerik.ok) return { error: icerik.error };

  await updateGame(id, {
    title: ortak.title,
    description: readOptionalText(formData, "description"),
    type,
    content: icerik.content,
    isArabic: readBoolean(formData, "isArabic"),
    isActive: readBoolean(formData, "isActive"),
    grades: ortak.grades,
  });

  tazeleOyunlar(ortak.grades);
  return { success: "Oyun güncellendi." };
}

export async function deleteGameAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = readText(formData, "gameId");
  if (!id) return { error: "Oyun bulunamadı." };

  await deleteGame(id);
  tazeleOyunlar();
  return { success: "Oyun silindi." };
}
