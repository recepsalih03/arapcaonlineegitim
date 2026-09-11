import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
