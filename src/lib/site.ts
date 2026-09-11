import "server-only";

import { headers } from "next/headers";

import { SITE_URL } from "@/lib/constants";

/**
 * Kullanıcıya gösterilecek public linkleri üretmek için sitenin adresi.
 * Vercel'de host başlıktan okunur; yerelde localhost'a düşer.
 */
export async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return SITE_URL;
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}
