import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authConfig } from "@/modules/auth/config";

/**
 * Kaba erişim katmanı (Next.js 16 "proxy" dosya konvansiyonu — eski adıyla
 * middleware).
 *
 * BURADA SADECE TEK BİR ŞEYE BAKILIR: ortada bir oturum token'ı var mı?
 *
 * Rol ve "zorunlu ilk giriş" gibi kararlar bilerek burada VERİLMEZ. Sebebi:
 * token bir çerezdir ve içindeki bilgi bayatlar. Öğrenci ilk-giriş akışını
 * tamamladığında veritabanı güncellenir ama çerezdeki mustChangeCredentials
 * hâlâ true kalır. Bu katman çereze bakıp /ilk-giris'e, o sayfa da veritabanına
 * bakıp /panel'e yönlendirince sonsuz döngü oluşuyordu.
 *
 * Doğru yer sunucu tarafı: requireOnboardedUser() / requireAdmin() /
 * requireStudent() her istekte veritabanından tazeleyip karar verir
 * (src/modules/auth/session.ts). Tek kaynak, bayat veri yok, döngü yok.
 */
const { auth } = NextAuth(authConfig);

/**
 * Yönlendirme adresi isteğin KENDİ host'undan üretilir.
 * `nextUrl.origin` kullanılamaz: Auth.js sarmalayıcısı isteği AUTH_URL'e göre
 * yeniden yazdığı için, farklı bir portta/önizleme adresinde çalışırken
 * kullanıcı yanlış host'a yönlenirdi.
 */
function redirectTo(request: NextRequest, path: string): NextResponse {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return NextResponse.redirect(new URL(path, request.nextUrl.origin));

  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return NextResponse.redirect(new URL(path, `${protocol}://${host}`));
}

export default auth((request) => {
  if (request.auth?.user) return NextResponse.next();

  // Girişsiz kullanıcıyı korumalı sayfalarda sunucuya kadar taşımaya gerek yok.
  return redirectTo(request, "/giris");
});

export const config = {
  matcher: ["/panel/:path*", "/panel", "/yonetim/:path*", "/yonetim", "/ilk-giris"],
};
