import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  SIGNED_UPLOAD_TTL_SECONDS,
} from "@/lib/constants";
import { isR2Configured } from "@/lib/env";
import { signedPutUrl } from "@/lib/r2";
import { getSessionUser } from "@/modules/auth/session";

/**
 * Doküman yükleme için presigned PUT linki üretir.
 * Video yüklemeyle aynı kalıp: tarayıcı dosyayı doğrudan R2'ye yazar.
 */

export const runtime = "nodejs";

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
});

function newPrefix(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint32Array(20);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `docs/${id}/`;
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

  const { fileName, mimeType, fileSize } = parsed.data;

  if (!ALLOWED_DOCUMENT_TYPES[mimeType]) {
    return NextResponse.json(
      { error: "Bu dosya türü desteklenmiyor." },
      { status: 400 },
    );
  }

  // Dosya adını güvenli hale getir: yalnızca ASCII harfler, rakamlar, tire, nokta.
  const safeName = fileName
    .normalize("NFC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);

  const prefix = newPrefix();
  const r2Key = `${prefix}${safeName}`;

  const url = await signedPutUrl(r2Key, mimeType, SIGNED_UPLOAD_TTL_SECONDS);

  return NextResponse.json({ prefix, r2Key, url, fileSize });
}
