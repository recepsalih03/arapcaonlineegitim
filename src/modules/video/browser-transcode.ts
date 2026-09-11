"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
// Yalnızca tip olarak alınıyor: FFFSType bir enum ve paketin UMD derlemesinde
// çalışma zamanında dışa aktarılmıyor; değer olarak import edilirse Turbopack
// "Export FFFSType doesn't exist" ile derlemeyi kırıyor.
import type { FFFSType } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

/**
 * Videoyu TARAYICIDA HLS'e çevirir (ffmpeg.wasm).
 *
 * Neden burada: Vercel'de ağır ffmpeg işi çalıştırılamıyor, öğretmenin de
 * terminale girip dosya dönüştürmesi beklenemez. Bu modül sayesinde yönetim
 * panelinde video dosyası seçmek yeterli; dönüştürme yükleyenin tarayıcısında
 * olur, sunucuya hiç ek maliyet çıkmaz.
 *
 * Üç mod var, hangisinin seçileceğine dosyanın kodeklerine bakılarak karar
 * verilir (planla()):
 *
 *  1. "kopyala"    — video H.264, ses AAC/MP3. Yeniden kodlama YOK, sadece
 *                    paketleme değişir. Çok hızlı (dakikalar değil saniyeler).
 *                    Ders kayıtlarının büyük çoğunluğu buraya düşer.
 *  2. "ses-kodla"  — video H.264 ama ses uyumsuz. Sadece ses kodlanır, yine hızlı.
 *  3. "tam-kodla"  — video H.264 değil (ör. iPhone'un HEVC'si). Yeniden kodlama
 *                    şart ve YAVAŞ. Kullanıcıya süre uyarısı gösterilir.
 */

/**
 * Yüklenen ffmpeg çekirdeğinin sürümü.
 *
 * Adreslere `?v=` olarak eklenir. Sebebi: çekirdek dosyaları bir yıl boyunca
 * `immutable` olarak önbelleklenir; sürüm yükseltildiğinde adres değişmezse
 * tarayıcı eski dosyayı kullanmaya devam eder — daha kötüsü, dosyalardan biri
 * önbellekten düşüp yenisi inerse sürümler karışır ve anlaşılmaz hatalar çıkar.
 *
 * package.json ile eşleşmesi scripts/ffmpeg-varliklari.mjs tarafından her
 * kurulum ve derlemede denetlenir; tutmuyorsa build durur.
 */
export const CEKIRDEK_SURUM = "0.12.10";

/** hls.js/MSE'nin tarayıcıda güvenle oynattığı kodekler. */
const OYNATILABILIR_VIDEO = ["h264"];
const OYNATILABILIR_SES = ["aac", "mp3"];

const CIKTI_KLASORU = "cikti";
/** Seçilen dosyanın ffmpeg içinde göründüğü klasör (WORKERFS ile bağlanır). */
const GIRDI_KLASORU = "/girdi";
const PLAYLIST_ADI = "master.m3u8";
const KAPAK_ADI = "poster.jpg";

/** Segment süresi (saniye). Kısa segment = daha hızlı başlangıç, daha çok dosya. */
const SEGMENT_SURESI = 6;

export type MedyaBilgisi = {
  sureSaniye: number | null;
  videoKodek: string | null;
  sesKodek: string | null;
  genislik: number | null;
  yukseklik: number | null;
};

export type DonusturmeModu = "kopyala" | "ses-kodla" | "tam-kodla";

export type DonusturmePlani = {
  mod: DonusturmeModu;
  /** Kullanıcıya gösterilecek açıklama. */
  aciklama: string;
  /** Kabaca tahmini süre metni. */
  sureTahmini: string;
  /** Yavaş yol mu? Arayüz buna göre uyarı gösterir. */
  yavas: boolean;
};

export type CiktiDosyasi = { yol: string; veri: Uint8Array };

export type DonusturmeSonucu = {
  dosyalar: CiktiDosyasi[];
  playlistAdi: string;
  kapakYolu: string | null;
  sureSaniye: number | null;
};

export type Asama =
  | { ad: "cekirdek-indiriliyor"; oran: number }
  | { ad: "dosya-okunuyor" }
  | { ad: "inceleniyor" }
  | { ad: "donusturuluyor"; oran: number }
  | { ad: "kapak-hazirlaniyor" }
  | { ad: "toplaniyor" };

// --- ffmpeg.wasm örneği (tek sefer yüklenir) --------------------------------

let ffmpegOrnegi: FFmpeg | null = null;
let sonLoglar: string[] = [];

/** Çekirdeğin ayağa kalkması için tanınan süre (indirme HARİÇ). */
const YUKLEME_ZAMAN_ASIMI_MS = 60_000;

function zamanAsimi<T>(soz: Promise<T>, ms: number, mesaj: string): Promise<T> {
  return Promise.race([
    soz,
    new Promise<never>((_, reddet) =>
      setTimeout(() => reddet(new Error(mesaj)), ms),
    ),
  ]);
}

/**
 * Çekirdeği yükler.
 *
 * TEK çekirdekli sürüm kullanılır; sebebi scripts/ffmpeg-varliklari.mjs
 * içinde ayrıntılı yazılı: çok çekirdekli sürüm pthread işçilerini klasik
 * worker olarak açıp içinde dinamik import kullandığı için tarayıcıda hiç
 * ayağa kalkmıyor ve load() sonsuza kadar bekliyor.
 *
 * Zaman aşımı yine de var: @ffmpeg/ffmpeg worker hatalarını dinlemediği için
 * beklenmedik bir arıza yine sessiz bir donmaya dönüşebilir. Kullanıcıyı
 * süresiz "hazırlanıyor" ekranında bırakmaktansa anlaşılır bir hata veriyoruz.
 */
async function ffmpegGetir(
  ilerleme?: (oran: number) => void,
): Promise<FFmpeg> {
  if (ffmpegOrnegi?.loaded) return ffmpegOrnegi;

  // Adresler TAM (mutlak) olmak zorunda.
  //
  // @ffmpeg/ffmpeg worker'ı şöyle açıyor:
  //     new Worker(new URL(classWorkerURL, import.meta.url), ...)
  // Paketlenmiş kodda `import.meta.url` bir `file://` yolu olabiliyor; kök-göreli
  // bir adres ("/ffmpeg/...") o tabana oturunca `file:///ffmpeg/...` çıkıyor ve
  // tarayıcı "Script at 'file:///...' cannot be accessed from origin" diyerek
  // worker'ı kurmayı reddediyor. window.location.origin ile tam adres vererek
  // tabanı tamamen devre dışı bırakıyoruz.
  const koken = window.location.origin;
  const klasor = `${koken}/ffmpeg/${CEKIRDEK_SURUM}/core`;
  const adres = {
    js: `${klasor}/ffmpeg-core.js`,
    wasm: `${klasor}/ffmpeg-core.wasm`,
    sinifWorker: `${koken}/ffmpeg/${CEKIRDEK_SURUM}/lib/worker.js`,
  };

  // Dosyalar gerçekten sunuluyor mu? Eksikse hata mesajı "wasm yüklenemedi"
  // gibi anlamsız değil, ne yapılacağını söyleyen bir şey olsun.
  const denetim = await fetch(adres.js, { method: "HEAD" }).catch(() => null);
  if (!denetim?.ok) {
    throw new Error(
      "Video dönüştürücü dosyaları sunucuda bulunamadı. " +
        'Terminalde "npm run ffmpeg:varliklar" çalıştırın.',
    );
  }

  // İlk kullanımda ~32 MB'lık çekirdek iniyor. ffmpeg.load() bu indirmeyi kendi
  // içinde yapıyor ve ilerleme bildirmiyor; yavaş bağlantıda arayüz dakikalarca
  // donmuş görünüyordu. Bu yüzden dosyayı ÖNCE biz indirip ilerlemeyi
  // bildiriyoruz. load() aynı adresi istediğinde dosya tarayıcı önbelleğinden
  // anında gelir (immutable, bir yıl).
  await onbellegeAl(adres.wasm, ilerleme);

  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    sonLoglar.push(message);
    if (sonLoglar.length > 400) sonLoglar.shift();
  });

  try {
    await zamanAsimi(
      ffmpeg.load({
        classWorkerURL: adres.sinifWorker,
        coreURL: adres.js,
        wasmURL: adres.wasm,
      }),
      YUKLEME_ZAMAN_ASIMI_MS,
      "Video dönüştürücü başlatılamadı (zaman aşımı).",
    );
  } catch (hata) {
    // Takılı kalmış worker'ı bırakma.
    ffmpeg.terminate();
    throw new Error(
      "Video dönüştürücü başlatılamadı. Sayfayı yenileyip tekrar deneyin; " +
        "sorun sürerse tarayıcınızı güncelleyin veya Chrome ile deneyin." +
        (hata instanceof Error ? `\n\n(${hata.message})` : ""),
    );
  }

  ffmpegOrnegi = ffmpeg;
  return ffmpeg;
}

/**
 * Dosyayı indirip tarayıcı önbelleğine koyar, bu sırada ilerlemeyi bildirir.
 * Gövde okunmadan önbelleğe yazılmayacağı için akış sonuna kadar tüketilir.
 */
async function onbellegeAl(
  adres: string,
  ilerleme?: (oran: number) => void,
): Promise<void> {
  ilerleme?.(0);

  let yanit: Response;
  try {
    yanit = await fetch(adres);
  } catch {
    // İndirme başarısız olsa bile load() kendi denemesini yapsın.
    return;
  }
  if (!yanit.ok || !yanit.body) return;

  const toplam = Number(yanit.headers.get("content-length") ?? 0);
  const okuyucu = yanit.body.getReader();
  let inen = 0;

  for (;;) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    inen += value.byteLength;
    if (toplam > 0) ilerleme?.(Math.min(0.99, inen / toplam));
  }

  ilerleme?.(1);
}

// --- İnceleme ---------------------------------------------------------------

/** ffmpeg loglarından kodek/süre/çözünürlük çıkarır. Test edilebilsin diye dışa açık. */
export function logdanBilgiCikar(loglar: string[]): MedyaBilgisi {
  const metin = loglar.join("\n");

  const sure = metin.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const sureSaniye = sure
    ? Math.round(
        Number(sure[1]) * 3600 + Number(sure[2]) * 60 + Number(sure[3]),
      )
    : null;

  const videoSatiri = metin.match(/Stream #\d+:\d+.*?:\s*Video:\s*([\w]+)[^\n]*/);
  const sesSatiri = metin.match(/Stream #\d+:\d+.*?:\s*Audio:\s*([\w]+)/);

  let genislik: number | null = null;
  let yukseklik: number | null = null;
  if (videoSatiri) {
    // "1280x720" — SAR/DAR parantezlerinden önce gelen ilk çözünürlük.
    const olcu = videoSatiri[0].match(/,\s*(\d{2,5})x(\d{2,5})/);
    if (olcu) {
      genislik = Number(olcu[1]);
      yukseklik = Number(olcu[2]);
    }
  }

  return {
    sureSaniye,
    videoKodek: videoSatiri ? videoSatiri[1].toLowerCase() : null,
    sesKodek: sesSatiri ? sesSatiri[1].toLowerCase() : null,
    genislik,
    yukseklik,
  };
}

/** Süreye ve moda göre kaba bir tahmin metni üretir. */
function sureTahminiUret(mod: DonusturmeModu, sureSaniye: number | null): string {
  if (mod !== "tam-kodla") {
    return "birkaç saniye – birkaç dakika";
  }
  if (!sureSaniye) return "uzun sürebilir";

  // Tek çekirdekli wasm'da yeniden kodlama kabaca gerçek zamanın 2-5 katı
  // sürüyor. Az söyleyip kullanıcıyı şaşırtmaktansa geniş bir aralık veriyoruz.
  const dakika = sureSaniye / 60;
  const alt = Math.max(1, Math.round(dakika * 2));
  const ust = Math.max(alt + 1, Math.round(dakika * 5));
  return `yaklaşık ${alt}–${ust} dakika`;
}

export function planla(bilgi: MedyaBilgisi): DonusturmePlani {
  const videoUygun =
    bilgi.videoKodek !== null && OYNATILABILIR_VIDEO.includes(bilgi.videoKodek);
  // Ses hiç yoksa sorun değil; varsa oynatılabilir olmalı.
  const sesUygun =
    bilgi.sesKodek === null || OYNATILABILIR_SES.includes(bilgi.sesKodek);

  if (videoUygun && sesUygun) {
    return {
      mod: "kopyala",
      aciklama:
        "Video zaten uyumlu biçimde. Yeniden kodlama yapılmayacak, kalite birebir korunacak.",
      sureTahmini: sureTahminiUret("kopyala", bilgi.sureSaniye),
      yavas: false,
    };
  }

  if (videoUygun && !sesUygun) {
    return {
      mod: "ses-kodla",
      aciklama: `Görüntü uyumlu, yalnızca ses (${bilgi.sesKodek}) dönüştürülecek. Görüntü kalitesi birebir korunacak.`,
      sureTahmini: sureTahminiUret("ses-kodla", bilgi.sureSaniye),
      yavas: false,
    };
  }

  return {
    mod: "tam-kodla",
    aciklama: `Videonun biçimi (${bilgi.videoKodek ?? "bilinmiyor"}) tarayıcılarda oynatılamıyor, bu yüzden yeniden kodlanması gerekiyor. Bu işlem uzun sürer.`,
    sureTahmini: sureTahminiUret("tam-kodla", bilgi.sureSaniye),
    yavas: true,
  };
}

/** Dosyayı ffmpeg'e yazıp kodeklerini okur. Dosya bellekte kalır, tekrar yazılmaz. */
export async function incele(
  dosya: File,
  asama?: (a: Asama) => void,
): Promise<{ bilgi: MedyaBilgisi; plan: DonusturmePlani; girdiAdi: string }> {
  const ffmpeg = await ffmpegGetir((oran) =>
    asama?.({ ad: "cekirdek-indiriliyor", oran }),
  );

  asama?.({ ad: "dosya-okunuyor" });
  const girdiAdi = await girdiyiBagla(ffmpeg, dosya);

  asama?.({ ad: "inceleniyor" });
  sonLoglar = [];
  // Çıktı verilmediği için ffmpeg hata koduyla biter; bizi ilgilendiren log.
  await ffmpeg.exec(["-i", girdiAdi]);
  const bilgi = logdanBilgiCikar(sonLoglar);

  if (!bilgi.videoKodek) {
    throw new Error(
      "Bu dosyada video akışı bulunamadı. Geçerli bir video dosyası seçtiğinizden emin olun.",
    );
  }

  return { bilgi, plan: planla(bilgi), girdiAdi };
}

/**
 * Videoyu ffmpeg'in görebileceği hâle getirir.
 *
 * Tercih edilen yol WORKERFS: dosya ffmpeg'e KOPYALANMAZ, referansla bağlanır
 * ve gerektikçe okunur. Eski yöntem (fetchFile + writeFile) 1 GB'lık bir videoyu
 * önce ana iş parçacığında belleğe alıyor, sonra worker'a kopyalıyor, sonra da
 * sanal dosya sistemine yazıyordu — aynı videonun üç kopyası, dakikalarca
 * bekleme ve şişen bellek. WORKERFS ile bu adım anında bitiyor.
 *
 * Tarayıcı WORKERFS'i desteklemezse eski yönteme düşülür.
 */
async function girdiyiBagla(ffmpeg: FFmpeg, dosya: File): Promise<string> {
  try {
    await ffmpeg.createDir(GIRDI_KLASORU).catch(() => undefined);
    await ffmpeg.mount("WORKERFS" as FFFSType, { files: [dosya] }, GIRDI_KLASORU);
    return `${GIRDI_KLASORU}/${dosya.name}`;
  } catch {
    const yedekAd = `girdi${uzantiAl(dosya.name)}`;
    await ffmpeg.writeFile(yedekAd, await fetchFile(dosya));
    return yedekAd;
  }
}

/** girdiyiBagla ile açılanı kapatır. */
async function girdiyiBirak(ffmpeg: FFmpeg, girdiAdi: string): Promise<void> {
  if (girdiAdi.startsWith(`${GIRDI_KLASORU}/`)) {
    await ffmpeg.unmount(GIRDI_KLASORU).catch(() => undefined);
    return;
  }
  await ffmpeg.deleteFile(girdiAdi).catch(() => undefined);
}

function uzantiAl(ad: string): string {
  const nokta = ad.lastIndexOf(".");
  if (nokta === -1) return ".mp4";
  const uzanti = ad.slice(nokta).toLowerCase();
  return /^\.[a-z0-9]{2,5}$/.test(uzanti) ? uzanti : ".mp4";
}

// --- Dönüştürme -------------------------------------------------------------

function argumanlariUret(mod: DonusturmeModu, girdiAdi: string): string[] {
  const ortak = [
    "-hls_time",
    String(SEGMENT_SURESI),
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    `${CIKTI_KLASORU}/segment_%04d.ts`,
    "-f",
    "hls",
    `${CIKTI_KLASORU}/${PLAYLIST_ADI}`,
  ];

  switch (mod) {
    case "kopyala":
      return ["-i", girdiAdi, "-c", "copy", ...ortak];

    case "ses-kodla":
      return [
        "-i", girdiAdi,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        ...ortak,
      ];

    case "tam-kodla":
      return [
        "-i", girdiAdi,
        // 720p'nin üstüne çıkma: hem dönüştürme hem izleme hafifler.
        // Virgül ters bölü ile kaçırılır; burada kabuk yok, ffmpeg'in kendi
        // filtre sözdizimi geçerli.
        "-vf", "scale=min(1280\\,iw):-2",
        "-c:v", "libx264",
        "-profile:v", "main",
        "-pix_fmt", "yuv420p",
        "-crf", "26",
        "-preset", "veryfast",
        // Sabit anahtar kare aralığı: segmentler düzgün bölünsün.
        "-g", "48",
        "-keyint_min", "48",
        "-sc_threshold", "0",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        ...ortak,
      ];
  }
}

export async function hlseDonustur(
  dosya: File,
  secenekler: {
    girdiAdi: string;
    plan: DonusturmePlani;
    bilgi: MedyaBilgisi;
    asama?: (a: Asama) => void;
  },
): Promise<DonusturmeSonucu> {
  const { girdiAdi, plan, bilgi, asama } = secenekler;
  const ffmpeg = await ffmpegGetir();

  await ffmpeg.createDir(CIKTI_KLASORU).catch(() => {
    // Klasör zaten varsa sorun değil.
  });

  const ilerlemeDinleyici = ({ progress }: { progress: number }) => {
    asama?.({
      ad: "donusturuluyor",
      oran: Math.min(1, Math.max(0, progress)),
    });
  };
  ffmpeg.on("progress", ilerlemeDinleyici);

  try {
    sonLoglar = [];
    asama?.({ ad: "donusturuluyor", oran: 0 });

    const kod = await ffmpeg.exec(argumanlariUret(plan.mod, girdiAdi));
    if (kod !== 0) {
      throw new Error(
        "Video dönüştürülemedi. Dosya bozuk olabilir veya desteklenmeyen bir " +
          "biçimde olabilir.\n\nffmpeg çıktısı:\n" +
          sonLoglar.slice(-6).join("\n"),
      );
    }

    // Kapak görseli — başarısız olursa video yine de yüklenir.
    asama?.({ ad: "kapak-hazirlaniyor" });
    let kapakVar = false;
    const kapakAni = bilgi.sureSaniye && bilgi.sureSaniye > 10 ? "5" : "0";
    const kapakKodu = await ffmpeg
      .exec([
        "-ss", kapakAni,
        "-i", girdiAdi,
        "-frames:v", "1",
        "-vf", "scale=min(1280\\,iw):-2",
        `${CIKTI_KLASORU}/${KAPAK_ADI}`,
      ])
      .catch(() => 1);
    kapakVar = kapakKodu === 0;

    // Çıktıları topla.
    asama?.({ ad: "toplaniyor" });
    const dosyalar: CiktiDosyasi[] = [];
    for (const dugum of await ffmpeg.listDir(CIKTI_KLASORU)) {
      if (dugum.isDir) continue;
      const veri = await ffmpeg.readFile(`${CIKTI_KLASORU}/${dugum.name}`);
      if (typeof veri === "string") continue;
      dosyalar.push({ yol: dugum.name, veri });
    }

    if (!dosyalar.some((d) => d.yol === PLAYLIST_ADI)) {
      throw new Error("Dönüştürme tamamlandı ama playlist dosyası oluşmadı.");
    }

    // Belleği boşalt: büyük dosyalarda sekme şişmesin.
    await temizle(ffmpeg, girdiAdi, dosyalar.map((d) => d.yol));

    return {
      dosyalar,
      playlistAdi: PLAYLIST_ADI,
      kapakYolu: kapakVar ? KAPAK_ADI : null,
      sureSaniye: bilgi.sureSaniye,
    };
  } finally {
    ffmpeg.off("progress", ilerlemeDinleyici);
  }
}

async function temizle(ffmpeg: FFmpeg, girdiAdi: string, ciktilar: string[]) {
  await girdiyiBirak(ffmpeg, girdiAdi);
  for (const ad of ciktilar) {
    await ffmpeg.deleteFile(`${CIKTI_KLASORU}/${ad}`).catch(() => undefined);
  }
}

/** Sekme kapanırken/işlem iptal edilirken worker'ı düşür. */
export function serbestBirak(): void {
  ffmpegOrnegi?.terminate();
  ffmpegOrnegi = null;
}
