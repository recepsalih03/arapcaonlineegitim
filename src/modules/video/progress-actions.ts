"use server";

import { z } from "zod";

import { requireStudent } from "@/modules/auth/session";
import { izlemeKaydet } from "@/modules/video/progress";
import { canWatch, getVideo } from "@/modules/video/service";

const sema = z.object({
  videoId: z.string().min(1).max(40),
  positionSec: z.number().finite().min(0).max(24 * 60 * 60),
  durationSec: z.number().finite().min(1).max(24 * 60 * 60),
});

/**
 * Öğrencinin video ilerlemesini kaydeder.
 *
 * Konum istemciden geliyor (oynatma tarayıcıda); yani "bu öğrenci videoyu
 * açtı ve şuraya kadar geldi" bilgisi sayılmalı, izlediğinin ispatı değil.
 * Sunucu yine de sınırları zorluyor: video öğrencinin erişebileceği bir video
 * olmalı ve konum süreyi aşamaz.
 */
export async function izlemeKaydetAction(girdi: {
  videoId: string;
  positionSec: number;
  durationSec: number;
}): Promise<{ ok: boolean }> {
  const parsed = sema.safeParse(girdi);
  if (!parsed.success) return { ok: false };

  const student = await requireStudent();

  const video = await getVideo(parsed.data.videoId);
  if (
    !video ||
    !canWatch(video, { kind: "student", gradeLevel: student.gradeLevel })
  ) {
    return { ok: false };
  }

  await izlemeKaydet({
    videoId: parsed.data.videoId,
    userId: student.id,
    positionSec: parsed.data.positionSec,
    durationSec: parsed.data.durationSec,
  });

  return { ok: true };
}
