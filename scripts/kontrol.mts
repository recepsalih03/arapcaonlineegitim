/**
 * Kurulum kontrolü: "her şeyi doğru doldurdum mu?" sorusunu cevaplar.
 *
 * Çalıştırma:  npm run kontrol
 *
 * Sırayla bakar: .env dosyası → değişkenler → Neon bağlantısı → tablolar →
 * admin hesabı → R2 erişimi → R2 yazma izni. İlk hatada durmaz, hepsini
 * raporlar ki tek seferde düzeltebilesiniz.
 */

import { readFileSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";

/** Bu makinenin LAN adresleri — telefondan test için CORS'a eklenmesi gerekenler. */
function yerelIpAdresleri(): string[] {
  const sonuc: string[] = [];
  for (const arayuzler of Object.values(networkInterfaces())) {
    for (const a of arayuzler ?? []) {
      if (a.family === "IPv4" && !a.internal) sonuc.push(a.address);
    }
  }
  return sonuc;
}

const KOK = process.cwd();

// --- .env okuma (bağımlılıksız, basit ayrıştırıcı) -------------------------
function envOku(dosya: string): Record<string, string> {
  if (!existsSync(dosya)) return {};
  const sonuc: Record<string, string> = {};
  for (const satir of readFileSync(dosya, "utf8").split("\n")) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith("#")) continue;
    const esit = temiz.indexOf("=");
    if (esit === -1) continue;
    const anahtar = temiz.slice(0, esit).trim();
    let deger = temiz.slice(esit + 1).trim();
    if (
      (deger.startsWith('"') && deger.endsWith('"')) ||
      (deger.startsWith("'") && deger.endsWith("'"))
    ) {
      deger = deger.slice(1, -1);
    }
    sonuc[anahtar] = deger;
  }
  return sonuc;
}

// --- Rapor yardımcıları ----------------------------------------------------
let hataSayisi = 0;
let uyariSayisi = 0;

const YESIL = "\x1b[32m";
const KIRMIZI = "\x1b[31m";
const SARI = "\x1b[33m";
const GRI = "\x1b[90m";
const SIFIRLA = "\x1b[0m";

function baslik(metin: string) {
  console.log(`\n${metin}`);
  console.log("─".repeat(metin.length));
}

function tamam(metin: string) {
  console.log(`  ${YESIL}✓${SIFIRLA} ${metin}`);
}

function hata(metin: string, cozum?: string) {
  hataSayisi++;
  console.log(`  ${KIRMIZI}✗${SIFIRLA} ${metin}`);
  if (cozum) console.log(`    ${GRI}→ ${cozum}${SIFIRLA}`);
}

function uyari(metin: string, cozum?: string) {
  uyariSayisi++;
  console.log(`  ${SARI}!${SIFIRLA} ${metin}`);
  if (cozum) console.log(`    ${GRI}→ ${cozum}${SIFIRLA}`);
}

// --- 1. .env dosyası -------------------------------------------------------
baslik("1. .env dosyası");

const envYolu = path.join(KOK, ".env");
if (!existsSync(envYolu)) {
  hata(
    ".env dosyası yok.",
    "README.md'deki \"Ortam değişkenleri\" şablonunu kopyalayıp proje kökünde .env olarak kaydedin.",
  );
  console.log("\nDevam edilemiyor. Önce .env dosyasını oluşturun.");
  process.exit(1);
}
tamam(".env dosyası bulundu.");

const env = { ...envOku(envYolu), ...process.env } as Record<string, string>;

// --- 2. Ortam değişkenleri -------------------------------------------------
baslik("2. Ortam değişkenleri");

function zorunlu(
  anahtar: string,
  aciklama: string,
  dogrula?: (deger: string) => string | null,
): string | null {
  const deger = env[anahtar];
  if (!deger || deger.trim() === "") {
    hata(`${anahtar} boş.`, aciklama);
    return null;
  }
  if (dogrula) {
    const sorun = dogrula(deger);
    if (sorun) {
      hata(`${anahtar}: ${sorun}`, aciklama);
      return null;
    }
  }
  tamam(`${anahtar} dolu.`);
  return deger;
}

const dbUrl = zorunlu(
  "DATABASE_URL",
  "Neon panelinde Connection string > Pooled connection değerini kopyalayın.",
  (deger) =>
    deger.startsWith("postgres://") || deger.startsWith("postgresql://")
      ? null
      : "postgresql:// ile başlamalı.",
);

if (dbUrl && !dbUrl.includes("-pooler")) {
  uyari(
    "DATABASE_URL havuzlu (pooled) adres gibi görünmüyor.",
    "Neon'da 'Pooled connection' seçeneğini kullanın; yoksa Vercel'de bağlantı tükenebilir.",
  );
}
if (dbUrl && !/sslmode=/.test(dbUrl)) {
  uyari(
    "DATABASE_URL içinde sslmode yok.",
    "Adresin sonuna ?sslmode=verify-full ekleyin; Neon şifreli bağlantı ister.",
  );
} else if (dbUrl && !dbUrl.includes("sslmode=verify-full")) {
  uyari(
    "DATABASE_URL'de sslmode=verify-full yerine başka bir değer var.",
    "verify-full yapın: sertifika doğrulaması tam olur ve pg sürücüsünün SSL uyarısı susar.",
  );
}

zorunlu(
  "DIRECT_DATABASE_URL",
  "Neon'da 'Direct connection' adresi. Migration'lar bunu kullanır.",
);

zorunlu(
  "AUTH_SECRET",
  "Üretmek için: openssl rand -base64 32",
  (deger) => (deger.length >= 32 ? null : "En az 32 karakter olmalı."),
);

if (env.AUTH_URL) {
  uyari(
    "AUTH_URL tanımlı.",
    "Bu projede AUTH_URL kullanmayın; AUTH_TRUST_HOST=true yeterli. Sabit adres önizleme dağıtımlarını bozar.",
  );
}

const r2Hesap = zorunlu(
  "R2_ACCOUNT_ID",
  "Cloudflare panelinin sağ üstündeki Account ID.",
);
zorunlu("R2_ACCESS_KEY_ID", "R2 > Manage API Tokens ile ürettiğiniz Access Key ID.");
zorunlu("R2_SECRET_ACCESS_KEY", "R2 API Token'ın Secret Access Key değeri.");
const r2Kova = zorunlu("R2_BUCKET", "Cloudflare R2'de oluşturduğunuz bucket adı.");

if (!env.R2_ENDPOINT && r2Hesap) {
  uyari(
    "R2_ENDPOINT boş; hesap kimliğinden türetilecek.",
    `Sorun yaşarsanız şunu yazın: https://${r2Hesap}.r2.cloudflarestorage.com`,
  );
}

const seedSifre = env.SEED_ADMIN_PASSWORD;
if (seedSifre === "degistir-beni") {
  hata(
    "SEED_ADMIN_PASSWORD hâlâ örnek değerde ('degistir-beni').",
    "Kendi güçlü şifrenizi yazın; admin hesabı bununla oluşturulacak.",
  );
} else if (seedSifre && seedSifre.length < 10) {
  uyari(
    "SEED_ADMIN_PASSWORD kısa.",
    "Admin hesabı için en az 10-12 karakterlik bir şifre kullanın.",
  );
} else if (seedSifre) {
  tamam("SEED_ADMIN_PASSWORD ayarlanmış.");
}

// --- 3. Veritabanı bağlantısı ---------------------------------------------
baslik("3. Neon veritabanı");

let dbCalisiyor = false;

if (!dbUrl) {
  hata("DATABASE_URL olmadan bağlantı denenemez.");
} else {
  try {
    const { Client } = await import("pg");
    const istemci = new Client({ connectionString: dbUrl });
    await istemci.connect();
    const surum = await istemci.query("select version()");
    tamam(
      `Bağlantı kuruldu (${String(surum.rows[0].version).split(",")[0]}).`,
    );
    dbCalisiyor = true;

    // Tablolar oluşturulmuş mu?
    const tablolar = await istemci.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public'`,
    );
    const mevcut = new Set(tablolar.rows.map((satir) => satir.table_name));
    /*
     * Tablo listesini ELLE yazmıyoruz: şemadan okuyoruz.
     * Elle yazılan liste şema değişince sessizce yanlışa düşüyordu —
     * kaldırılan AboutPage "eksik tablo" diye hata verirken sonradan eklenen
     * VideoFolder/Game tabloları hiç kontrol edilmiyordu.
     */
    const semaYolu = path.join(KOK, "prisma", "schema.prisma");
    const beklenen = [
      ...readFileSync(semaYolu, "utf8").matchAll(/^model\s+(\w+)\s*\{/gm),
    ].map((eslesme) => eslesme[1]);
    const eksik = beklenen.filter((tablo) => !mevcut.has(tablo));

    if (eksik.length === beklenen.length) {
      hata(
        "Hiçbir tablo yok.",
        "Şu komutu çalıştırın: npm run db:deploy",
      );
    } else if (eksik.length > 0) {
      hata(
        `Eksik tablolar: ${eksik.join(", ")}`,
        "Şu komutu çalıştırın: npm run db:deploy",
      );
    } else {
      tamam(`${beklenen.length} tablonun hepsi yerinde.`);

      // Admin hesabı var mı?
      const adminler = await istemci.query<{ username: string }>(
        `select username from "User" where role = 'ADMIN'`,
      );
      if (adminler.rowCount === 0) {
        hata(
          "Admin hesabı yok.",
          "Şu komutu çalıştırın: npm run db:seed",
        );
      } else {
        tamam(
          `Admin hesabı var: ${adminler.rows.map((s) => s.username).join(", ")}`,
        );
      }

      const ogrenciler = await istemci.query<{ count: string }>(
        `select count(*)::text as count from "User" where role = 'STUDENT'`,
      );
      const videolar = await istemci.query<{ count: string }>(
        `select count(*)::text as count from "Video"`,
      );
      console.log(
        `  ${GRI}  ${ogrenciler.rows[0].count} öğrenci, ${videolar.rows[0].count} video kayıtlı.${SIFIRLA}`,
      );
    }

    await istemci.end();
  } catch (error) {
    hata(
      `Bağlanılamadı: ${error instanceof Error ? error.message : String(error)}`,
      "DATABASE_URL'i Neon panelinden yeniden kopyalayın. Adresin tamamını (şifre dahil) aldığınızdan emin olun.",
    );
  }
}

// --- 4. Cloudflare R2 ------------------------------------------------------
baslik("4. Cloudflare R2");

if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !r2Kova || !r2Hesap) {
  hata("R2 değişkenleri eksik olduğu için erişim denenemedi.");
} else {
  try {
    const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } =
      await import("@aws-sdk/client-s3");

    const istemci = new S3Client({
      region: "auto",
      endpoint:
        env.R2_ENDPOINT || `https://${r2Hesap}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const liste = await istemci.send(
      new ListObjectsV2Command({ Bucket: r2Kova, MaxKeys: 1 }),
    );
    tamam(
      `Bucket okunabiliyor: ${r2Kova} (${liste.KeyCount ?? 0} nesne görüldü).`,
    );

    // Yazma iznini gerçekten dene; token "Object Read only" olabilir.
    const denemeAnahtari = `kontrol/${Date.now()}.txt`;
    await istemci.send(
      new PutObjectCommand({
        Bucket: r2Kova,
        Key: denemeAnahtari,
        Body: "kontrol",
        ContentType: "text/plain",
      }),
    );
    await istemci.send(
      new DeleteObjectCommand({ Bucket: r2Kova, Key: denemeAnahtari }),
    );
    tamam("Yazma ve silme izni var.");

    // --- CORS ---
    // Eksik CORS videoyu tarayıcıda SESSİZCE bozuyor (oynatıcı 0:00'da kalır).
    // R2, CORS kurallarını S3 API'siyle okutmuyor; bu yüzden gerçek bir istek
    // atıp yanıtta izin başlığı var mı diye bakıyoruz — tarayıcının yaptığının
    // aynısı.
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const ornekAnahtar = liste.Contents?.[0]?.Key;
    if (!ornekAnahtar) {
      uyari(
        "Bucket boş olduğu için CORS sınanamadı.",
        "İlk videoyu yükledikten sonra 'npm run kontrol' komutunu tekrar çalıştırın.",
      );
    } else {
      const imzali = await getSignedUrl(
        istemci,
        new GetObjectCommand({ Bucket: r2Kova, Key: ornekAnahtar }),
        { expiresIn: 120 },
      );

      const denenecekler = [
        { etiket: "bilgisayarınız", kaynak: "http://localhost:3000" },
        ...yerelIpAdresleri().map((ip) => ({
          etiket: "telefon (aynı Wi-Fi)",
          kaynak: `http://${ip}:3000`,
        })),
      ];

      for (const { etiket, kaynak } of denenecekler) {
        let izin: string | null = null;
        try {
          const yanit = await fetch(imzali, {
            method: "GET",
            headers: { Origin: kaynak, Range: "bytes=0-0" },
          });
          izin = yanit.headers.get("access-control-allow-origin");
        } catch {
          izin = null;
        }

        if (izin === kaynak || izin === "*") {
          tamam(`CORS izinli — ${etiket}: ${kaynak}`);
        } else if (kaynak.includes("localhost")) {
          hata(
            `CORS izni YOK — ${kaynak}`,
            "Bu adresten videolar oynatılamaz (oynatıcı 0:00'da kalır). Cloudflare R2 > bucket > Settings > CORS Policy altına README'deki JSON'u ekleyin.",
          );
        } else {
          uyari(
            `CORS izni yok — ${etiket}: ${kaynak}`,
            `Telefondan test edecekseniz R2 CORS politikasındaki AllowedOrigins listesine "${kaynak}" satırını ekleyin. Üretimde gerekmez; orada sitenin alan adı yeterli.`,
          );
        }
      }
    }
  } catch (error) {
    const mesaj = error instanceof Error ? error.message : String(error);
    if (/NoSuchBucket/i.test(mesaj)) {
      hata(
        `"${r2Kova}" adında bucket bulunamadı.`,
        "Cloudflare R2'de bu adla bir bucket oluşturun ya da R2_BUCKET değerini düzeltin.",
      );
    } else if (/AccessDenied|SignatureDoesNotMatch|InvalidAccessKeyId/i.test(mesaj)) {
      hata(
        `Erişim reddedildi: ${mesaj}`,
        "API Token'ı 'Object Read & Write' yetkisiyle yeniden oluşturup anahtarları .env'e kopyalayın.",
      );
    } else {
      hata(
        `R2'ye ulaşılamadı: ${mesaj}`,
        "R2_ACCOUNT_ID ve R2_ENDPOINT değerlerini kontrol edin.",
      );
    }
  }
}

// --- Özet ------------------------------------------------------------------
baslik("Özet");

if (hataSayisi === 0 && uyariSayisi === 0) {
  console.log(`  ${YESIL}Her şey hazır. "npm run dev" ile başlayabilirsiniz.${SIFIRLA}\n`);
} else {
  console.log(
    `  ${hataSayisi} hata, ${uyariSayisi} uyarı.` +
      (hataSayisi === 0
        ? ` ${YESIL}Hata yok — uyarıları okuyup devam edebilirsiniz.${SIFIRLA}`
        : ` ${KIRMIZI}Yukarıdaki hataları giderip tekrar çalıştırın.${SIFIRLA}`),
  );
  if (dbCalisiyor && hataSayisi === 0) {
    console.log(`  "npm run dev" ile başlayabilirsiniz.`);
  }
  console.log();
}

process.exit(hataSayisi > 0 ? 1 : 0);
