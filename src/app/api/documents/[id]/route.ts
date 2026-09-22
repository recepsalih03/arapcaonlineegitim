import { NextResponse } from "next/server";

import { getObject } from "@/lib/r2";
import { getSessionUser } from "@/modules/auth/session";
import { getDocument } from "@/modules/document/service";

/**
 * Doküman indirme/görüntüleme.
 *
 * Oturum ve sınıf yetki kontrolü yapıldıktan sonra dosya doğrudan R2'den
 * istemciye stream edilir. Böylece:
 * - Adres çubuğunda Cloudflare/AWS URL'i yerine temiz kendi sitemiz kalır.
 * - PDF'ler tarayıcıda doğrudan (inline) açılır.
 * - Diğer dosyalar (Word, Excel vb.) orijinal dosya adıyla iner.
 * - Okul/MEB güvenlik filtrelerine takılmaz.
 */

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const doc = await getDocument(id);
  if (!doc || !doc.isActive) {
    return NextResponse.json({ error: "Doküman bulunamadı." }, { status: 404 });
  }

  // Admin her dokümanı görebilir; öğrenci yalnızca kendi sınıfındakileri.
  if (user.role === "STUDENT") {
    const hasAccess = doc.grades.some(
      (g) => g.gradeLevel === user.gradeLevel,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    }
  }

  try {
    const r2Object = await getObject(doc.r2Key);
    if (!r2Object.Body) {
      return NextResponse.json(
        { error: "Dosya içeriği bulunamadı." },
        { status: 404 },
      );
    }

    const isPdf = doc.mimeType === "application/pdf";
    const dispositionType = isPdf ? "inline" : "attachment";

    // RFC 6266 / RFC 5987 uyumlu dosya adı (Türkçe karakterlerin bozulmaması için)
    const encodedFileName = encodeURIComponent(doc.fileName).replace(/'/g, "%27");
    const safeAsciiName = doc.fileName.replace(/[^\x20-\x7E]/g, "_");

    return new Response(r2Object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": String(doc.fileSize),
        "Content-Disposition": `${dispositionType}; filename="${safeAsciiName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Doküman getirme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir sorun oluştu." },
      { status: 500 },
    );
  }
}
