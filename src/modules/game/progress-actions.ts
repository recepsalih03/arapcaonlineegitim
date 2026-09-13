"use server";

import { z } from "zod";

import { requireStudent } from "@/modules/auth/session";
import { ilerlemeKaydet } from "@/modules/game/progress";
import { getActiveGame } from "@/modules/game/service";

const sema = z.object({
  gameId: z.string().min(1).max(40),
  dogru: z.number().int().min(0).max(1000),
  toplam: z.number().int().min(1).max(1000),
  yeniDeneme: z.boolean(),
});

/**
 * Öğrencinin oyundaki ilerlemesini kaydeder.
 *
 * Skor istemciden geliyor; oyun tamamen tarayıcıda çalıştığı için başka türlüsü
 * mümkün değil. Bu yüzden yalnızca "öğrenci bu alıştırmayı yaptı mı" sorusunun
 * cevabı sayılmalı, sınav notu gibi değil. Tüm oyunlar herkese açık olduğu için
 * öğrenci başka sınıfın oyununu da oynayıp kaydedebilir; tek şart oyunun AKTİF
 * olması ve doğru sayısının toplamı aşmaması.
 */
export async function ilerlemeKaydetAction(girdi: {
  gameId: string;
  dogru: number;
  toplam: number;
  yeniDeneme: boolean;
}): Promise<{ ok: boolean }> {
  const parsed = sema.safeParse(girdi);
  if (!parsed.success) return { ok: false };

  const student = await requireStudent();

  // Oyun aktif olmalı; sınıf ayrımı yok (tüm oyunlar herkese açık).
  const game = await getActiveGame(parsed.data.gameId);
  if (!game) return { ok: false };

  await ilerlemeKaydet({
    gameId: parsed.data.gameId,
    userId: student.id,
    dogru: parsed.data.dogru,
    toplam: parsed.data.toplam,
    yeniDeneme: parsed.data.yeniDeneme,
  });

  return { ok: true };
}
