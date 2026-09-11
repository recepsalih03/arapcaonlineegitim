import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

// Prisma 7 ve tsx, .env dosyasını kendiliğinden yüklemiyor; elle yüklüyoruz.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env yoksa değişkenler ortamdan gelmiş olabilir (CI, Vercel).
}

/**
 * İlk kurulum verisi: admin hesabı.
 * Çalıştırmak için: npm run db:seed
 *
 * Admin bilgileri .env içindeki SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD
 * değerlerinden okunur. Var olan admin varsa şifresi DEĞİŞTİRİLMEZ.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil. .env dosyanızı kontrol edin.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const username = (process.env.SEED_ADMIN_USERNAME ?? "admin").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    console.log(`Admin zaten var: ${username} (şifre değiştirilmedi)`);
  } else {
    if (!password) {
      throw new Error(
        "SEED_ADMIN_PASSWORD tanımlı değil. .env dosyasına güçlü bir şifre yazın.",
      );
    }
    // Örnek değerle admin oluşturmak, herkesin bildiği bir şifreyle yönetici
    // hesabı açmak demek olurdu.
    if (password === "degistir-beni") {
      throw new Error(
        "SEED_ADMIN_PASSWORD hâlâ örnek değerde ('degistir-beni').\n" +
          ".env dosyasında kendi güçlü şifrenizi yazıp tekrar deneyin.",
      );
    }
    if (password.length < 10) {
      throw new Error(
        "SEED_ADMIN_PASSWORD çok kısa. En az 10 karakterlik bir şifre kullanın.",
      );
    }
    await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 12),
        role: "ADMIN",
        fullName: "Öğretmen",
        // Admin geçici bilgiyle oluşturulmuyor; ilk-giriş akışı gerekmez.
        mustChangeCredentials: false,
      },
    });
    console.log(`Admin oluşturuldu: ${username}`);
    console.log("İlk girişten sonra şifrenizi panelden değiştirmeniz önerilir.");
  }

}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
