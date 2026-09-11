import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * "X-Powered-By: Next.js" başlığını kapat. Saldırgana kullanılan teknolojiyi
   * söylemenin bir faydası yok; bilinen açıkları hedeflemeyi kolaylaştırır.
   */
  poweredByHeader: false,

  /*
   * Geliştirme sunucusuna telefondan (LAN IP ile) erişebilmek için.
   *
   * Next 16, dev kaynaklarına localhost DIŞINDAKİ adreslerden gelen istekleri
   * varsayılan olarak engelliyor. Telefondan `http://192.168.x.x:3000` açınca
   * sayfa geliyor ama istemci JS'i yüklenmiyordu: form hiç çalışmıyor, giriş
   * yapılamıyordu. Yalnızca geliştirmeyi etkiler, üretimde karşılığı yoktur.
   *
   * Farklı bir ağdaysanız DEV_ORIGINS ile ekleyebilirsiniz:
   *   DEV_ORIGINS="192.168.2.15,bilgisayarim.local" npm run dev
   */
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "*.local",
    ...(process.env.DEV_ORIGINS?.split(",").map((x) => x.trim()).filter(Boolean) ??
      []),
  ],

  async headers() {
    return [
      {
        /**
         * Tüm sayfalara uygulanan güvenlik başlıkları.
         *
         * - X-Frame-Options / frame-ancestors: siteyi bir başkasının iframe'ine
         *   gömüp tıklama kaçırma (clickjacking) saldırısını engeller.
         * - X-Content-Type-Options: tarayıcının içerik türünü "tahmin edip"
         *   yanlış çalıştırmasını engeller.
         * - Referrer-Policy: başka siteye geçerken tam adresi sızdırmaz.
         * - Permissions-Policy: kamera/mikrofon/konum gibi güçlü API'leri kapatır;
         *   site bunları kullanmıyor.
         * - CSP: sayfada yalnızca kendi kaynaklarımız + izin verilen dış servisler
         *   (R2 video, Google Fonts) çalışsın; enjekte edilen bir script çalışamaz.
         *   'unsafe-inline'/'unsafe-eval' Next.js'in çalışması için gerekli.
         */
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https://*.r2.cloudflarestorage.com",
              "connect-src 'self' blob: https://*.r2.cloudflarestorage.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        /**
         * ffmpeg.wasm dosyaları uzun süre önbellekte kalsın. Adres sürüm
         * içerdiği için (/ffmpeg/<surum>/...) "immutable" güvenli: sürüm
         * yükseltilince adres kendiliğinden değişir.
         *
         * Not: COOP/COEP başlıkları BİLEREK yok. Onlar yalnızca çok çekirdekli
         * ffmpeg'in istediği SharedArrayBuffer için gerekliydi; o sürüm
         * tarayıcıda çalışmadığı için kullanılmıyor (bkz.
         * scripts/ffmpeg-varliklari.mjs). Gereksiz izolasyon, ileride
         * eklenecek dış kaynakları sessizce bloklardı.
         */
        source: "/ffmpeg/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
