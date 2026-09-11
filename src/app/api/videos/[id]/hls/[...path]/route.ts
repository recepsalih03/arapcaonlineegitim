import { NextResponse } from "next/server";

import { SIGNED_SEGMENT_TTL_SECONDS } from "@/lib/constants";
import { signedGetUrl } from "@/lib/r2";
import { getSessionUser } from "@/modules/auth/session";
import { normalizeRelativePath, rewritePlaylist } from "@/modules/video/hls";
import { canWatch, getVideo, type ViewerContext } from "@/modules/video/service";

/**
 * HLS playlist proxy'si (PROJE.md §1, §2).
 *
 * Buradan YALNIZCA .m3u8 metni geçer. Segmentler (.ts/.m4s) playlist içinde
 * kısa ömürlü imzalı R2 linkine çevrilir ve tarayıcı onları doğrudan R2'den
 * çeker — böylece video verisi Vercel fonksiyon limitlerine hiç dokunmaz.
 *
 * Her istekte yetki yeniden doğrulanır (PROJE.md §2c).
 */

export const runtime = "nodejs";
// Playlist her istekte yeniden imzalanır; önbelleğe alınmamalı.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; path: string[] }> },
) {
  const { id, path } = await context.params;

  const requestedPath = normalizeRelativePath(path.map(decodeURIComponent).join("/"));
  if (!requestedPath) {
    return NextResponse.json({ error: "Geçersiz yol." }, { status: 400 });
  }

  // Segment isteklerinin sunucudan geçmesine hiç izin verilmez.
  if (!requestedPath.toLowerCase().endsWith(".m3u8")) {
    return NextResponse.json(
      { error: "Bu adres yalnızca playlist dosyaları içindir." },
      { status: 400 },
    );
  }

  const video = await getVideo(id);
  if (!video) {
    return NextResponse.json({ error: "Video bulunamadı." }, { status: 404 });
  }

  const sessionUser = await getSessionUser();
  const viewer: ViewerContext = !sessionUser
    ? { kind: "guest" }
    : sessionUser.role === "ADMIN"
      ? { kind: "admin" }
      : { kind: "student", gradeLevel: sessionUser.gradeLevel ?? -1 };

  if (!canWatch(video, viewer)) {
    return NextResponse.json({ error: "Bu videoya erişiminiz yok." }, { status: 403 });
  }

  const prefix = video.hlsPrefix.endsWith("/")
    ? video.hlsPrefix
    : `${video.hlsPrefix}/`;

  let playlistText: string;
  try {
    const { getObjectText } = await import("@/lib/r2");
    playlistText = await getObjectText(`${prefix}${requestedPath}`);
  } catch {
    return NextResponse.json(
      { error: "Video dosyası bulunamadı." },
      { status: 404 },
    );
  }

  const origin = new URL(request.url).origin;
  const rewritten = await rewritePlaylist({
    playlistPath: requestedPath,
    content: playlistText,
    proxyBase: `${origin}/api/videos/${encodeURIComponent(id)}/hls`,
    signSegment: (relativePath) =>
      signedGetUrl(`${prefix}${relativePath}`, SIGNED_SEGMENT_TTL_SECONDS),
  });

  return new NextResponse(rewritten, {
    headers: {
      "content-type": "application/vnd.apple.mpegurl; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, private",
      // Playlist'in indirilip saklanmasını caydırmak için.
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
    },
  });
}
