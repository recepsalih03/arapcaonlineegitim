import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma 7 driver adapter üzerinden çalışır (Rust engine yok).
 * Neon'un *pooled* bağlantı adresi kullanılmalıdır; serverless ortamda
 * bağlantı sayısı böyle kontrol altında kalır.
 *
 * İstemci TEMBEL kurulur: modül import edildiğinde değil, ilk sorguda.
 * Böylece DATABASE_URL olmadan da `next build` tamamlanabilir ve eksik
 * ortam değişkeni hatası, sorgunun yapıldığı yerde anlaşılır biçimde çıkar.
 *
 * Geliştirmede hot-reload'da yeni havuz açılmasın diye global'de saklanır.
 */

/**
 * Neon'un ücretsiz planı bir süre işlem olmayınca veritabanını uyutuyor.
 * Uyandırma birkaç saniye sürdüğü için o aradaki İLK sorgu "Can't reach
 * database server" ile patlıyordu — yani günün ilk ziyaretçisi hata görüyordu.
 *
 * Çözüm: yalnızca BAĞLANTI hatalarında sorguyu birkaç kez yeniden dene.
 * Veri hatalarında (benzersizlik ihlali, bulunamadı vb.) tekrar denemek yanlış
 * olurdu, o yüzden hata kodları özellikle süzülüyor.
 */
const BAGLANTI_HATA_KODLARI = new Set([
  "P1000", // kimlik doğrulama
  "P1001", // sunucuya ulaşılamıyor  ← uyanma durumu
  "P1002", // zaman aşımı
  "P1008", // işlem zaman aşımı
  "P1017", // sunucu bağlantıyı kapattı
]);

const BAGLANTI_HATA_METINLERI = [
  "can't reach database server",
  "connection terminated",
  "connection closed",
  "econnreset",
  "etimedout",
];

function baglantiHatasiMi(hata: unknown): boolean {
  if (!hata || typeof hata !== "object") return false;

  const kod = (hata as { code?: unknown }).code;
  if (typeof kod === "string" && BAGLANTI_HATA_KODLARI.has(kod)) return true;

  const mesaj = (hata as { message?: unknown }).message;
  if (typeof mesaj !== "string") return false;
  const kucuk = mesaj.toLowerCase();
  return BAGLANTI_HATA_METINLERI.some((parca) => kucuk.includes(parca));
}

/** Uyanmasını beklerken artan aralıklarla tekrar dene. */
const YENIDEN_DENEME_BEKLEMELERI_MS = [400, 1200, 2500];

function bekle(ms: number) {
  return new Promise((coz) => setTimeout(coz, ms));
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        let sonHata: unknown;

        for (let deneme = 0; deneme <= YENIDEN_DENEME_BEKLEMELERI_MS.length; deneme++) {
          try {
            return await query(args);
          } catch (hata) {
            sonHata = hata;
            if (!baglantiHatasiMi(hata)) throw hata;

            const bekleme = YENIDEN_DENEME_BEKLEMELERI_MS[deneme];
            if (bekleme === undefined) break;

            console.warn(
              `[prisma] Veritabanına ulaşılamadı, ${bekleme}ms sonra yeniden ` +
                `denenecek (${deneme + 1}. deneme). Neon uykudan uyanıyor olabilir.`,
            );
            await bekle(bekleme);
          }
        }

        throw sonHata;
      },
    },
  });
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
};

function getClient(): AppPrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: AppPrismaClient = new Proxy({} as AppPrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getClient(), property, receiver);
  },
});
