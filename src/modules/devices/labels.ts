/**
 * User-Agent'tan okunabilir cihaz etiketi üretir ("iPhone · Safari" gibi).
 * Kesinlik hedeflenmiyor; öğrenci cihaz listesinde hangi cihazı sildiğini
 * anlayabilsin diye var.
 */

const OS_RULES: Array<[RegExp, string]> = [
  [/iPhone/i, "iPhone"],
  [/iPad/i, "iPad"],
  [/Android/i, "Android"],
  [/Windows NT/i, "Windows"],
  [/Mac OS X|Macintosh/i, "Mac"],
  [/CrOS/i, "Chromebook"],
  [/Linux/i, "Linux"],
];

// Sıra önemli: Edge kendini Chrome, Chrome kendini Safari gibi tanıtır.
const BROWSER_RULES: Array<[RegExp, string]> = [
  [/Edg\//i, "Edge"],
  [/OPR\/|Opera/i, "Opera"],
  [/SamsungBrowser/i, "Samsung Internet"],
  [/YaBrowser/i, "Yandex"],
  [/Firefox\/|FxiOS/i, "Firefox"],
  [/CriOS|Chrome\//i, "Chrome"],
  [/Safari\//i, "Safari"],
];

function matchFirst(rules: Array<[RegExp, string]>, ua: string): string | null {
  for (const [pattern, name] of rules) {
    if (pattern.test(ua)) return name;
  }
  return null;
}

export function deviceLabelFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Bilinmeyen cihaz";
  const os = matchFirst(OS_RULES, userAgent);
  const browser = matchFirst(BROWSER_RULES, userAgent);
  if (os && browser) return `${os} · ${browser}`;
  return os ?? browser ?? "Bilinmeyen cihaz";
}

/**
 * IP'nin kabası: IPv4'te son oktet, IPv6'da son blok maskelenir.
 * Tam IP saklanmaz — öğrenciye "bu ben miydim" ipucu vermeye yeter.
 */
export function coarseIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const clean = ip.split(",")[0].trim();
  if (!clean) return null;
  if (clean.includes(":")) {
    const blocks = clean.split(":");
    blocks[blocks.length - 1] = "x";
    return blocks.join(":");
  }
  const octets = clean.split(".");
  if (octets.length !== 4) return null;
  octets[3] = "x";
  return octets.join(".");
}
