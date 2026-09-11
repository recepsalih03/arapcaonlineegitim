import { NextResponse } from "next/server";
import { z } from "zod";

import { SIGNED_UPLOAD_TTL_SECONDS, VIDEO_PREFIX_PATTERN } from "@/lib/constants";
import { isR2Configured } from "@/lib/env";
import { signedPutUrl } from "@/lib/r2";
import { getSessionUser } from "@/modules/auth/session";
import {
  contentTypeFor,
  isAllowedHlsFile,
  normalizeRelativePath,
} from "@/modules/video/hls";

/**
 * Presigned upload linki üretir (PROJE.md §1 "Yükleme").
 *
 * Tarayıcı dosyaları BU sunucuya değil, doğrudan R2'ye yükler. Vercel yalnızca
 * imzayı üretir — büyük dosya fonksiyondan hiç geçmez.
 *
 * Beklenen akış: yönetim panelinde seçilen video tarayıcıda HLS'e çevrilir
 * (bkz. src/modules/video/browser-transcode.ts); ortaya çıkan her parça için
 * buradan bir imza alınıp dosya doğrudan R2'ye yüklenir.
 */

export const runtime = "nodejs";

const bodySchema = z.object({
  /** Aynı yükleme oturumunun ikinci turunda gönderilir; yoksa yeni üretilir. */
  prefix: z
    .string()
    .regex(VIDEO_PREFIX_PATTERN, "Geçersiz yükleme klasörü.")
    .optional(),
  files: z
    .array(
      z.object({
        path: z.string().min(1).max(400),
        size: z.number().int().nonnegative().optional(),
      }),
    )
    .min(1)
    .max(2000),
});

function newPrefix(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint32Array(20);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `videos/${id}/`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Cloudflare R2 ayarları eksik. .env dosyasındaki R2_* değişkenlerini doldurun.",
      },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz istek." },
      { status: 400 },
    );
  }

  const prefix = parsed.data.prefix ?? newPrefix();

  const uploads: Array<{ path: string; url: string; contentType: string }> = [];
  for (const file of parsed.data.files) {
    const relative = normalizeRelativePath(file.path);
    if (!relative || !isAllowedHlsFile(relative)) {
      return NextResponse.json(
        { error: `Bu dosya türü yüklenemez: ${file.path}` },
        { status: 400 },
      );
    }
    const contentType = contentTypeFor(relative);
    uploads.push({
      path: relative,
      contentType,
      url: await signedPutUrl(
        `${prefix}${relative}`,
        contentType,
        SIGNED_UPLOAD_TTL_SECONDS,
      ),
    });
  }

  return NextResponse.json({ prefix, uploads });
}
