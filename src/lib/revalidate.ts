import "server-only";

import { revalidatePath } from "next/cache";

import { GRADES } from "@/lib/constants";

/**
 * Bir kayıt değiştiğinde tazelenecek sayfalar — tek yerde.
 *
 * NEDEN TEK YERDE: her server action kendi listesini tuttuğunda, birinin
 * unuttuğu sayfa bayat kalıyordu. Somut örnek: video bir klasöre atandığında
 * liste tazeleniyor ama videonun KENDİ düzenleme sayfası tazelenmiyordu;
 * "Video güncellendi" yazmasına rağmen ekranda hâlâ "Klasörsüz" görünüyor,
 * ancak sayfadan çıkıp girince düzeliyordu.
 *
 * Dinamik sayfalar route KALIBIYLA tazeleniyor ("/yonetim/videolar/[id]"):
 * tek bir id değil, o kalıba uyan bütün sayfalar geçersiz kılınıyor. Bir klasör
 * adı değiştiğinde o klasördeki her videonun sayfası etkilendiği için tek tek
 * id saymak yetmezdi.
 */

function sinifPanelleri(grades: number[]) {
  for (const grade of grades.length ? grades : GRADES) {
    revalidatePath(`/yonetim/sinif/${grade}`);
  }
}

/** Öğrenci detay sayfasındaki ilerleme tabloları video/oyun değişiminden etkilenir. */
function ogrenciDetaylari() {
  revalidatePath("/yonetim/ogrenciler/[id]", "page");
}

export function tazeleVideolar(grades: number[] = []) {
  revalidatePath("/"); // ana sayfadaki örnek dersler
  revalidatePath("/yonetim");
  revalidatePath("/yonetim/videolar");
  revalidatePath("/yonetim/videolar/[id]", "page");
  revalidatePath("/panel");
  revalidatePath("/panel/videolar");
  revalidatePath("/panel/videolar/[id]", "page");
  revalidatePath("/izle/[slug]", "page");
  ogrenciDetaylari();
  sinifPanelleri(grades);
}

export function tazeleOyunlar(grades: number[] = []) {
  revalidatePath("/yonetim");
  revalidatePath("/yonetim/oyunlar");
  revalidatePath("/yonetim/oyunlar/[id]", "page");
  revalidatePath("/panel");
  revalidatePath("/panel/oyun");
  revalidatePath("/panel/oyun/[id]", "page");
  ogrenciDetaylari();
  sinifPanelleri(grades);
}

export function tazeleDuyurular(grades: number[] = []) {
  revalidatePath("/yonetim");
  revalidatePath("/yonetim/duyurular");
  revalidatePath("/yonetim/duyurular/[id]", "page");
  revalidatePath("/panel");
  revalidatePath("/panel/duyurular");
  sinifPanelleri(grades);
}

export function tazeleAnketler(grades: number[] = []) {
  revalidatePath("/yonetim");
  revalidatePath("/yonetim/anketler");
  revalidatePath("/yonetim/anketler/[id]", "page");
  revalidatePath("/panel");
  revalidatePath("/panel/anketler");
  sinifPanelleri(grades);
}

export function tazeleOgrenciler(grade?: number | null) {
  revalidatePath("/yonetim");
  revalidatePath("/yonetim/ogrenciler");
  revalidatePath("/yonetim/ogrenciler/[id]", "page");
  if (grade) revalidatePath(`/yonetim/sinif/${grade}`);
}

/** Klasör değişimi hem yönetim hem öğrenci taraflarındaki video listelerini etkiler. */
export function tazeleKlasorler(grade?: number | null) {
  revalidatePath("/yonetim/videolar");
  revalidatePath("/yonetim/videolar/[id]", "page");
  revalidatePath("/panel/videolar");
  revalidatePath("/panel/videolar/[id]", "page");
  if (grade) revalidatePath(`/yonetim/sinif/${grade}`);
}
