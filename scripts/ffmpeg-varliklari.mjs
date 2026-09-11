/**
 * ffmpeg.wasm dosyalarını node_modules'ten public/ffmpeg altına kopyalar.
 *
 * Neden kopyalıyoruz da CDN'den çekmiyoruz:
 *  - Dosyalar aynı kaynaktan (same-origin) gelmezse COEP/COOP izolasyonu ve
 *    SharedArrayBuffer sorun çıkarıyor; çok çekirdekli dönüştürme çalışmıyor.
 *  - Ders platformunun video yükleme özelliği üçüncü parti bir CDN'in ayakta
 *    olmasına bağlı olmamalı.
 *
 * ~65 MB'lık bu dosyalar git'e girmez (.gitignore); hem `npm install` sonrası
 * hem de `npm run build` başında otomatik kopyalanır.
 */

import { cp, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * ESM sürümleri kopyalanır (UMD değil): @ffmpeg/ffmpeg worker'ı
 * `type: "module"` ile açtığı için importScripts kullanamıyor, dinamik
 * import ile ESM core yüklüyor.
 */
const KOPYALANACAKLAR = [
  // FFmpeg sınıfının kendi worker'ı ve bağımlılıkları (~30 KB).
  { kaynak: "@ffmpeg/ffmpeg/dist/esm", hedef: "lib" },
  // Tek çekirdekli ffmpeg (~32 MB).
  { kaynak: "@ffmpeg/core/dist/esm", hedef: "core" },
];

/*
 * @ffmpeg/core-mt (çok çekirdekli) BİLEREK kullanılmıyor.
 *
 * Sebebi paketin kendi içindeki bir tutarsızlık: çok çekirdekli çekirdek
 * pthread işçilerini KLASİK worker olarak açıyor (`new Worker(url)`, type
 * belirtmeden) ama o worker dosyası çekirdeği dinamik `import()` ile yüklüyor.
 * Dinamik import klasik worker'larda desteklenmiyor; işçiler hiç ayağa
 * kalkamıyor, Emscripten'in "ready" sözü hiç çözülmüyor ve @ffmpeg/ffmpeg
 * worker hatalarını dinlemediği için `load()` SONSUZA KADAR bekliyor —
 * kullanıcı ekranda "hazırlanıyor" yazısıyla kalıyor, hata bile görmüyor.
 *
 * Tek çekirdekli çekirdek hiç worker açmıyor, SharedArrayBuffer istemiyor ve
 * `export default` ile geliyor; yani tutarlı ve çalışan bileşim bu. Bedeli
 * yalnızca yeniden kodlamanın yavaşlaması — kopyalama (asıl sık kullanılan)
 * yolu zaten disk/bellek hızına bağlı, çok çekirdekten fayda görmüyordu.
 */

async function varMi(yol) {
  try {
    await stat(yol);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kaynak koddaki sürüm sabiti ile kurulu paket sürümünü karşılaştırır.
 *
 * Çekirdek dosyaları bir yıl `immutable` önbelleklendiği için adresteki `?v=`
 * sürümü yanlışsa kullanıcılar eski dosyayı kullanmaya devam eder. Sessizce
 * yanlış çalışmaktansa burada gürültülü biçimde duruyoruz.
 */
async function surumuDenetle() {
  const paket = JSON.parse(
    await readFile(
      path.join(KOK, "node_modules", "@ffmpeg", "core-mt", "package.json"),
      "utf8",
    ),
  );
  const kaynak = await readFile(
    path.join(KOK, "src", "modules", "video", "browser-transcode.ts"),
    "utf8",
  );
  const eslesme = kaynak.match(/CEKIRDEK_SURUM\s*=\s*"([^"]+)"/);

  if (!eslesme) {
    throw new Error(
      "browser-transcode.ts içinde CEKIRDEK_SURUM sabiti bulunamadı.",
    );
  }
  if (eslesme[1] !== paket.version) {
    throw new Error(
      `ffmpeg çekirdek sürümü uyuşmuyor:\n` +
        `  kurulu paket : ${paket.version}\n` +
        `  kaynak koddaki CEKIRDEK_SURUM : ${eslesme[1]}\n\n` +
        `src/modules/video/browser-transcode.ts içindeki CEKIRDEK_SURUM ` +
        `değerini "${paket.version}" yapın. Bu değer tarayıcı önbelleğini ` +
        `tazelemek için adreslere ekleniyor; yanlış kalırsa kullanıcılar eski ` +
        `çekirdekle çalışmaya devam eder.`,
    );
  }

  return paket.version;
}

async function main() {
  const surum = await surumuDenetle();
  // Sürüm ADRESTE yer alır: /ffmpeg/<surum>/... Böylece dosyalar bir yıl
  // "immutable" önbelleklenebilir ve sürüm yükseltince adres kendiliğinden
  // değişir. Sorgu parametresi (?v=) yerine klasör kullanılıyor çünkü ffmpeg
  // çekirdeği kendi yan dosyalarını import.meta.url üzerinden çözüyor ve
  // adreste sorgu olması bu çözümlemeyi kırılganlaştırıyor.
  const HEDEF = path.join(KOK, "public", "ffmpeg", surum);
  await mkdir(HEDEF, { recursive: true });

  for (const { kaynak, hedef } of KOPYALANACAKLAR) {
    const kaynakYolu = path.join(KOK, "node_modules", kaynak);
    const hedefYolu = path.join(HEDEF, hedef);

    if (!(await varMi(kaynakYolu))) {
      console.warn(
        `[ffmpeg] Atlandı, paket bulunamadı: ${kaynak}\n` +
          `         "npm install" çalıştırılmadıysa normal.`,
      );
      continue;
    }

    // .d.ts, .map gibi tarayıcıda gereksiz dosyaları alma.
    await cp(kaynakYolu, hedefYolu, {
      recursive: true,
      filter: (src) => {
        const ad = path.basename(src);
        if (ad.endsWith(".d.ts") || ad.endsWith(".map")) return false;
        return true;
      },
    });
  }

  console.log(`[ffmpeg] Dosyalar hazır: public/ffmpeg/${surum}`);
}

await main();
