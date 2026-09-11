/**
 * HLS playlist yeniden yazımı (PROJE.md §1, §2).
 *
 * Amaç: video verisinin Vercel'den geçmemesi. Sunucudan geçen tek şey
 * birkaç kilobaytlık .m3u8 metni; içindeki segment (.ts/.m4s) adresleri
 * kısa ömürlü imzalı R2 linkleriyle değiştirilir, böylece tarayıcı segmentleri
 * doğrudan R2'den çeker.
 *
 * Yan fayda: playlist her istekte yeniden imzalandığı için tek bir kalıcı
 * indirilebilir link ortaya çıkmaz.
 */

/** Bir yolu ".." ve "." parçalarından arındırır. Sonuç asla kökün dışına çıkmaz. */
export function normalizeRelativePath(input: string): string | null {
  const parts = input.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (stack.length === 0) return null; // kök dışına çıkma denemesi
      stack.pop();
      continue;
    }
    if (part.includes("\\") || part.includes("\0")) return null;
    stack.push(part);
  }
  return stack.length > 0 ? stack.join("/") : null;
}

/** `dir` içindeki `uri`yi ön eke göre göreli yola çevirir. */
function resolveAgainst(dir: string, uri: string): string | null {
  return normalizeRelativePath(dir ? `${dir}/${uri}` : uri);
}

function directoryOf(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function isAbsoluteUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri) || uri.startsWith("//");
}

export type RewriteOptions = {
  /** Playlist dosyasının R2 ön ekine göre yolu, ör. "master.m3u8" veya "720p/index.m3u8". */
  playlistPath: string;
  /** Playlist metni. */
  content: string;
  /** İç içe playlist'ler için proxy adresi, sonunda "/" olmadan. */
  proxyBase: string;
  /** Segment/anahtar dosyaları için imzalı link üretici. Yol, ön eke göredir. */
  signSegment: (relativePath: string) => Promise<string>;
};

/** URI taşıyan etiketler: `#EXT-X-KEY:...,URI="key.bin"` gibi. */
const URI_ATTRIBUTE_TAGS = ["#EXT-X-KEY", "#EXT-X-MAP", "#EXT-X-SESSION-KEY"];

export async function rewritePlaylist(options: RewriteOptions): Promise<string> {
  const { playlistPath, content, proxyBase, signSegment } = options;
  const baseDir = directoryOf(playlistPath);

  const lines = content.split(/\r?\n/);
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      output.push(line);
      continue;
    }

    if (trimmed.startsWith("#")) {
      const tag = trimmed.split(":", 1)[0];
      if (URI_ATTRIBUTE_TAGS.includes(tag) && trimmed.includes('URI="')) {
        output.push(await rewriteUriAttribute(trimmed, baseDir, signSegment));
      } else {
        output.push(line);
      }
      continue;
    }

    // Yorum olmayan satır = bir kaynak adresi.
    if (isAbsoluteUri(trimmed)) {
      output.push(line);
      continue;
    }

    const resolved = resolveAgainst(baseDir, stripQuery(trimmed));
    if (!resolved) {
      // Çözülemeyen adresi olduğu gibi bırakmak yerine düşürürüz.
      continue;
    }

    if (resolved.toLowerCase().endsWith(".m3u8")) {
      // İç içe playlist yine bizden geçer ki onun segmentleri de imzalansın.
      output.push(`${proxyBase}/${encodePath(resolved)}`);
    } else {
      output.push(await signSegment(resolved));
    }
  }

  return output.join("\n");
}

async function rewriteUriAttribute(
  line: string,
  baseDir: string,
  signSegment: (relativePath: string) => Promise<string>,
): Promise<string> {
  const match = line.match(/URI="([^"]*)"/);
  if (!match) return line;

  const uri = match[1];
  if (isAbsoluteUri(uri)) return line;

  const resolved = resolveAgainst(baseDir, stripQuery(uri));
  if (!resolved) return line;

  const signed = await signSegment(resolved);
  return line.replace(/URI="[^"]*"/, `URI="${signed}"`);
}

function stripQuery(uri: string): string {
  const index = uri.indexOf("?");
  return index === -1 ? uri : uri.slice(0, index);
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** Yüklenen dosya adlarının HLS klasörüne ait olup olmadığını denetler. */
export const ALLOWED_HLS_EXTENSIONS = [
  ".m3u8",
  ".ts",
  ".m4s",
  ".mp4",
  ".vtt",
  ".key",
  ".bin",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export function isAllowedHlsFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_HLS_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function contentTypeFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (lower.endsWith(".ts")) return "video/mp2t";
  if (lower.endsWith(".m4s")) return "video/iso.segment";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".vtt")) return "text/vtt";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}
