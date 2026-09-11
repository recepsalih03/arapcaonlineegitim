import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 yapılandırması.
 *
 * DİKKAT: Prisma 7 artık `.env` dosyasını KENDİLİĞİNDEN yüklemiyor (v6'da
 * yüklüyordu). Bu yüzden burada elle yüklüyoruz; yoksa `prisma migrate deploy`
 * "Connection url is empty" hatası verir. Uygulamanın kendisi Next.js
 * tarafından yüklendiği için bundan etkilenmez.
 */
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env yoksa sorun değil: değişkenler ortamdan da gelmiş olabilir
  // (ör. Vercel, CI). Eksiklik aşağıdaki url kontrolünde anlaşılır.
}

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Migration'lar havuzsuz (direct) bağlantı ister; yoksa normal URL'e düşer.
    url,
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "npx tsx prisma/seed.ts",
  },
});
