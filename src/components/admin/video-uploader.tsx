"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileVideo,
  Loader2,
  Wand2,
  X,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldHint, Input, Label, Textarea } from "@/components/ui/field";
import {
  GradeFolderPicker,
  type SinifKlasorleri,
} from "@/components/admin/grade-folder-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { formatDuration } from "@/lib/utils";
import { createVideoAction } from "@/modules/video/actions";
import {
  CekirdekBaslatilamadi,
  hlseDonustur,
  incele,
  serbestBirak,
  planla,
  type Asama,
  type DonusturmePlani,
  type MedyaBilgisi,
} from "@/modules/video/browser-transcode";

/**
 * Tarayıcı bir isteği AĞ düzeyinde yapamadığında ham bir TypeError atar:
 * Safari'de "Load failed", Chrome'da "Failed to fetch". Ortada HTTP durumu
 * bile yoktur, dolayısıyla cevap kontrolleri hiç çalışmaz.
 *
 * Bu sitede en sık sebebi, tarayıcıdan doğrudan Cloudflare R2'ye giden
 * yükleme isteğinin CORS'a takılmasıdır: R2 yalnızca izin listesindeki
 * adreslere cevap verir ve liste tam eşleşme arar. Site yeni bir adrese
 * taşındığında (ör. geçici vercel.app adresi) o adres listede olmaz.
 *
 * Ayrı bir tür olmasının sebebi: bu hata videonun içeriğiyle ilgili değil,
 * ama önceden "dosya paketlenemedi, yeniden kodlayalım" diye yorumlanıyordu.
 */
class YuklemeHatasi extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YuklemeHatasi";
  }
}

/** Ağ düzeyinde patlayan fetch'i anlaşılır bir hataya çevirir. */
async function agIstegi(
  istek: () => Promise<Response>,
  nerede: string,
): Promise<Response> {
  try {
    return await istek();
  } catch (hata) {
    const koken =
      typeof window === "undefined" ? "sitenin adresi" : window.location.origin;
    throw new YuklemeHatasi(
      `${nerede} bağlanılamadı. En olası sebep: Cloudflare R2'nin CORS izin ` +
        `listesinde "${koken}" adresi yok. R2 > bucket > Settings > CORS Policy ` +
        `> AllowedOrigins listesine bu adresi ekleyip tekrar deneyin.` +
        (hata instanceof Error ? `\n\n(${hata.message})` : ""),
    );
  }
}

/**
 * Video yükleme (PROJE.md §1, §12.1).
 *
 * Akış — öğretmenin yapması gereken tek şey dosyayı seçmek:
 *   1. Video dosyası seçilir (mp4, mov, mkv…).
 *   2. Tarayıcı dosyayı inceler, kodeklerine göre en hızlı yolu seçer.
 *   3. Tarayıcıda HLS'e çevrilir (bkz. modules/video/browser-transcode.ts).
 *   4. Parçalar presigned link ile DOĞRUDAN R2'ye yüklenir — Vercel'den geçmez.
 *   5. Başlık/sınıf bilgisi kaydedilir.
 *
 * Terminal, ffmpeg kurulumu veya el ile dönüştürme gerekmez.
 */

const PARALEL_YUKLEME = 4;

/** Bu sınırın üstünde tarayıcı belleği yetmeyebilir. */
const UYARI_BOYUTU = 1_000 * 1024 * 1024; // 1 GB
const AZAMI_BOYUT = 2_500 * 1024 * 1024; // 2,5 GB

type Durum =
  | { ad: "bos" }
  | { ad: "inceleniyor"; asama: Asama }
  | {
      ad: "onay-bekliyor";
      bilgi: MedyaBilgisi;
      plan: DonusturmePlani;
      /** Hızlı yol denenip başarısız olduysa kullanıcıya sebebini anlatır. */
      onNot?: string;
    }
  | { ad: "calisiyor"; asama: Asama; plan: DonusturmePlani }
  | { ad: "yukleniyor"; biten: number; toplam: number }
  | {
      ad: "hazir";
      onEk: string;
      playlistAdi: string;
      dosyaSayisi: number;
      kapakAnahtari: string | null;
      sureSaniye: number | null;
      plan: DonusturmePlani;
    }
  | { ad: "hata"; mesaj: string };

async function sinirliCalistir<T>(
  isler: T[],
  sinir: number,
  is: (item: T) => Promise<void>,
  ilerleme: (biten: number) => void,
): Promise<void> {
  let sira = 0;
  let biten = 0;

  async function kosucu() {
    while (sira < isler.length) {
      await is(isler[sira++]);
      biten++;
      ilerleme(biten);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(sinir, isler.length) }, () => kosucu()),
  );
}

function asamaMetni(asama: Asama): string {
  switch (asama.ad) {
    case "cekirdek-indiriliyor":
      return asama.oran > 0 && asama.oran < 1
        ? `Video dönüştürücü indiriliyor… %${Math.round(asama.oran * 100)}`
        : "Video dönüştürücü hazırlanıyor…";
    case "dosya-okunuyor":
      return "Dosya okunuyor…";
    case "inceleniyor":
      return "Video inceleniyor…";
    case "donusturuluyor":
      return `Dönüştürülüyor… %${Math.round(asama.oran * 100)}`;
    case "kapak-hazirlaniyor":
      return "Kapak görseli hazırlanıyor…";
    case "toplaniyor":
      return "Parçalar toplanıyor…";
  }
}

function asamaOrani(asama: Asama): number | null {
  if (asama.ad === "donusturuluyor") return asama.oran;
  if (asama.ad === "cekirdek-indiriliyor") return asama.oran;
  return null;
}

export function VideoUploader({
  foldersByGrade,
}: {
  foldersByGrade: SinifKlasorleri;
}) {
  const [formState, formAction] = useActionState(
    createVideoAction,
    EMPTY_ACTION_STATE,
  );
  const [durum, setDurum] = useState<Durum>({ ad: "bos" });
  const [dosyaAdi, setDosyaAdi] = useState<string | null>(null);
  const [buyukDosya, setBuyukDosya] = useState(false);
  /** Uzun işlemlerde geçen süre — "takıldı mı?" sorusunu cevaplar. */
  const baslangicRef = useRef<number | null>(null);
  const [, saniyeTiki] = useState(0);
  const girdiRef = useRef<HTMLInputElement>(null);

  // Sekme kapanırken wasm worker'ını düşür.
  useEffect(() => () => serbestBirak(), []);

  // İşlem sürerken sekmenin yanlışlıkla kapanmasını engelle.
  const mesgul =
    durum.ad === "inceleniyor" || durum.ad === "calisiyor" || durum.ad === "yukleniyor";
  useEffect(() => {
    if (!mesgul) return;
    const uyar = (olay: BeforeUnloadEvent) => olay.preventDefault();
    window.addEventListener("beforeunload", uyar);
    return () => window.removeEventListener("beforeunload", uyar);
  }, [mesgul]);

  // Saniyede bir yeniden çizerek geçen süreyi tazele.
  useEffect(() => {
    if (!mesgul) return;
    const sayac = window.setInterval(() => saniyeTiki((n) => n + 1), 1000);
    return () => window.clearInterval(sayac);
  }, [mesgul]);

  const gecenSaniye =
    mesgul && baslangicRef.current !== null
      ? Math.floor((Date.now() - baslangicRef.current) / 1000)
      : 0;

  /**
   * Uzun süren dönüştürmeyi durdurur. ffmpeg.wasm'ı yarıda kesmenin tek yolu
   * worker'ı sonlandırmak; sonraki denemede çekirdek yeniden yüklenir (dosyalar
   * önbellekte olduğu için hızlı).
   */
  function vazgec() {
    serbestBirak();
    baslangicRef.current = null;
    setDurum({
      ad: "hata",
      mesaj:
        "İşlem sizin isteğinizle durduruldu. Yeniden denemek için tekrar video seçin.",
    });
  }

  async function dosyaSecildi(dosya: File | null | undefined) {
    if (!dosya) return;

    setDosyaAdi(dosya.name);
    setBuyukDosya(dosya.size > UYARI_BOYUTU);
    baslangicRef.current = Date.now();

    if (dosya.size > AZAMI_BOYUT) {
      setDurum({
        ad: "hata",
        mesaj:
          `Dosya çok büyük (${(dosya.size / 1024 / 1024 / 1024).toFixed(1)} GB). ` +
          "Tarayıcıda dönüştürülebilecek en büyük boyut yaklaşık 2,5 GB. " +
          "Videoyu daha kısa parçalara bölerek yükleyin.",
      });
      return;
    }

    try {
      const { bilgi, plan } = await incele(dosya, (asama) =>
        setDurum({ ad: "inceleniyor", asama }),
      );

      // Hızlı yollarda kullanıcıyı bekletmeye gerek yok, doğrudan başla.
      if (!plan.yavas) {
        await donustur(dosya, plan, bilgi);
        return;
      }
      // Yavaş yol uzun sürer; onay al.
      setDurum({ ad: "onay-bekliyor", bilgi, plan });
    } catch (hata) {
      setDurum({
        ad: "hata",
        mesaj: hata instanceof Error ? hata.message : "Video incelenemedi.",
      });
    }
  }

  async function donustur(
    dosya: File,
    plan: DonusturmePlani,
    bilgi: MedyaBilgisi,
  ) {
    try {
      const sonuc = await hlseDonustur(dosya, {
        plan,
        bilgi,
        asama: (asama) => setDurum({ ad: "calisiyor", asama, plan }),
      });

      // --- R2'ye doğrudan yükleme ---
      setDurum({ ad: "yukleniyor", biten: 0, toplam: sonuc.dosyalar.length });

      const yanit = await agIstegi(
        () =>
          fetch("/api/admin/videos/presign", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              files: sonuc.dosyalar.map((d) => ({
                path: d.yol,
                size: d.veri.length,
              })),
            }),
          }),
        "Yükleme adresleri alınırken sunucuya",
      );

      const govde = (await yanit.json()) as
        | {
            prefix: string;
            uploads: Array<{ path: string; url: string; contentType: string }>;
          }
        | { error: string };

      if (!yanit.ok || "error" in govde) {
        throw new Error(
          "error" in govde ? govde.error : "Yükleme başlatılamadı.",
        );
      }

      const yolaGore = new Map(sonuc.dosyalar.map((d) => [d.yol, d.veri]));

      await sinirliCalistir(
        govde.uploads,
        PARALEL_YUKLEME,
        async (parca) => {
          const veri = yolaGore.get(parca.path);
          if (!veri) return;
          const cevap = await agIstegi(
            () =>
              fetch(parca.url, {
                method: "PUT",
                // Uint8Array'i doğrudan göndermek yerine Blob: bazı tarayıcılar
                // ArrayBufferView gövdelerinde Content-Length'i yanlış hesaplıyor.
                body: new Blob([new Uint8Array(veri)], {
                  type: parca.contentType,
                }),
                headers: { "content-type": parca.contentType },
              }),
            "Video parçaları Cloudflare'e gönderilirken",
          );
          if (!cevap.ok) {
            throw new Error(
              `"${parca.path}" yüklenemedi (${cevap.status}). ` +
                "R2 CORS ayarını kontrol edin.",
            );
          }
        },
        (biten) =>
          setDurum({ ad: "yukleniyor", biten, toplam: govde.uploads.length }),
      );

      setDurum({
        ad: "hazir",
        onEk: govde.prefix,
        playlistAdi: sonuc.playlistAdi,
        dosyaSayisi: sonuc.dosyalar.length,
        kapakAnahtari: sonuc.kapakYolu
          ? `${govde.prefix}${sonuc.kapakYolu}`
          : null,
        sureSaniye: sonuc.sureSaniye,
        plan,
      });
    } catch (hata) {
      const mesaj =
        hata instanceof Error ? hata.message : "Dönüştürme sırasında hata oluştu.";

      // Hızlı yol (kopyalama) bazı bozuk ya da alışılmadık dosyalarda
      // tökezleyebiliyor. Kullanıcıyı çıkmazda bırakmak yerine yavaş ama
      // her şeyi kabul eden yolu öner — kararı yine kullanıcı versin.
      //
      // Ama bu öneri YALNIZCA dosyadan kaynaklanan hatalar için anlamlı.
      // Dönüştürücü hiç açılamadıysa yeniden kodlama da aynı yerde patlar;
      // üstelik kullanıcıya "iPhone biçimi" gibi alakasız bir tavsiye ve
      // uydurma bir süre tahmini gösteriliyordu. Önceden bu ayrım metin
      // araması ile yapılıyordu ve tarayıcının ham hatası ("Load failed")
      // hiçbir kalıba uymadığı için yanlış tarafa düşüyordu.
      const yenidenKodlamaFaydasiz =
        hata instanceof CekirdekBaslatilamadi ||
        hata instanceof YuklemeHatasi ||
        mesaj.includes("yüklenemedi") ||
        mesaj.includes("CORS");
      if (plan.mod !== "tam-kodla" && !yenidenKodlamaFaydasiz) {
        setDurum({
          ad: "onay-bekliyor",
          bilgi,
          plan: {
            ...planla({ ...bilgi, videoKodek: "bilinmiyor" }),
            aciklama:
              "Video olduğu gibi paketlenemedi, bu yüzden yeniden kodlanması gerekiyor.",
          },
          onNot: mesaj,
        });
        return;
      }

      setDurum({ ad: "hata", mesaj });
    }
  }

  const hazir = durum.ad === "hazir";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-kum-900">1. Video dosyasını seçin</h2>
        </div>

        <input
          ref={girdiRef}
          type="file"
          accept="video/*,.mkv,.mov,.mp4,.webm,.avi"
          onChange={(olay) => void dosyaSecildi(olay.target.files?.[0])}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => girdiRef.current?.click()}
            disabled={mesgul}
          >
            {mesgul ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <FileVideo className="size-4" aria-hidden />
            )}
            {hazir ? "Başka video seç" : "Video seç"}
          </Button>
          {mesgul ? (
            <Button type="button" variant="ghost" size="sm" onClick={vazgec}>
              <X className="size-4" aria-hidden />
              Vazgeç
            </Button>
          ) : null}
          {dosyaAdi ? (
            <span className="min-w-0 truncate text-sm text-kum-500">{dosyaAdi}</span>
          ) : null}
        </div>

        {durum.ad === "inceleniyor" || durum.ad === "calisiyor" ? (
          <IlerlemeKutusu
            metin={asamaMetni(durum.asama)}
            oran={asamaOrani(durum.asama)}
            gecenSaniye={gecenSaniye}
            not={
              durum.ad === "inceleniyor" &&
              durum.asama.ad === "cekirdek-indiriliyor"
                ? "Dönüştürücü (~32 MB) yalnızca bu tarayıcıda ilk kullanımda iner; sonraki videolarda bu adım atlanır."
                : durum.ad === "calisiyor" && durum.plan.yavas
                  ? "Bu sayfayı kapatmayın. İşlem sürerken bilgisayarınızı kullanmaya devam edebilirsiniz."
                  : "Bu sayfayı kapatmayın."
            }
          />
        ) : null}

        {durum.ad === "onay-bekliyor" ? (
          <div className="space-y-3">
            <Alert tone="warning">
              <p className="font-medium">{durum.plan.aciklama}</p>
              {durum.onNot ? (
                <p className="mt-1.5 text-[13px] text-altin-700/80">
                  Sebep: {durum.onNot.split("\n")[0]}
                </p>
              ) : null}
              <p className="mt-1.5">
                Tahmini süre: <strong>{durum.plan.sureTahmini}</strong>
                {durum.bilgi.sureSaniye
                  ? ` (video ${formatDuration(durum.bilgi.sureSaniye)})`
                  : ""}
                . İşlem boyunca bu sekme açık kalmalı.
              </p>
              <p className="mt-1.5 text-[13px]">
                Bunu bir daha yaşamamak için: iPhone&apos;da{" "}
                <strong>Ayarlar → Kamera → Biçimler → En Uyumlu</strong> seçeneğini
                açarsanız videolar baştan uyumlu çekilir ve dönüştürme saniyeler
                sürer.
              </p>
            </Alert>
            <Button
              type="button"
              onClick={() => {
                const dosya = girdiRef.current?.files?.[0];
                if (!dosya) return;
                baslangicRef.current = Date.now();
                void donustur(dosya, durum.plan, durum.bilgi);
              }}
            >
              <Wand2 className="size-4" aria-hidden />
              Yine de dönüştür
            </Button>
          </div>
        ) : null}

        {durum.ad === "yukleniyor" ? (
          <IlerlemeKutusu
            metin={`Cloudflare'e yükleniyor… ${durum.biten}/${durum.toplam} parça`}
            oran={durum.toplam === 0 ? null : durum.biten / durum.toplam}
            gecenSaniye={gecenSaniye}
            not="Bu sayfayı kapatmayın."
          />
        ) : null}

        {buyukDosya && mesgul ? (
          <p className="flex items-start gap-2 text-xs text-kum-500">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Dosya büyük olduğu için işlem uzun sürebilir ve tarayıcı çok bellek
            kullanır. Takılırsa videoyu daha kısa bölümler hâlinde yükleyin.
          </p>
        ) : null}

        {durum.ad === "hata" ? (
          <Alert tone="error">
            <p className="font-medium">Video hazırlanamadı</p>
            <p className="mt-1 whitespace-pre-line">{durum.mesaj}</p>
          </Alert>
        ) : null}

        {hazir ? (
          <Alert tone="success">
            <span className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Video hazır ve yüklendi ({durum.dosyaSayisi} parça
                {durum.sureSaniye
                  ? `, ${formatDuration(durum.sureSaniye)}`
                  : ""}
                ). Aşağıdaki bilgileri doldurup kaydedin.
              </span>
            </span>
          </Alert>
        ) : null}

      </section>

      <hr className="border-kum-200" />

      <form action={formAction} className="space-y-4">
        <h2 className="font-semibold text-kum-900">2. Video bilgileri</h2>

        <ActionFeedback state={formState} />

        <Field>
          <Label htmlFor="title">Başlık</Label>
          <Input id="title" name="title" required placeholder="1. Ünite — Harfler" />
        </Field>

        <Field>
          <Label htmlFor="description">Açıklama (isteğe bağlı)</Label>
          <Textarea id="description" name="description" rows={3} />
        </Field>

        <GradeFolderPicker foldersByGrade={foldersByGrade} />

        {hazir ? (
          <>
            <input type="hidden" name="hlsPrefix" value={durum.onEk} />
            <input type="hidden" name="playlistName" value={durum.playlistAdi} />
            {durum.sureSaniye ? (
              <input type="hidden" name="durationSec" value={durum.sureSaniye} />
            ) : null}
            {durum.kapakAnahtari ? (
              <input type="hidden" name="posterKey" value={durum.kapakAnahtari} />
            ) : null}
          </>
        ) : null}

        <SubmitButton disabled={!hazir} pendingLabel="Kaydediliyor…">
          Videoyu kaydet
        </SubmitButton>

        {!hazir ? (
          <FieldHint>
            Kaydedebilmek için önce yukarıdan bir video seçmeniz gerekiyor.
          </FieldHint>
        ) : null}
      </form>
    </div>
  );
}

function IlerlemeKutusu({
  metin,
  oran,
  not,
  gecenSaniye,
}: {
  metin: string;
  oran: number | null;
  not?: string;
  gecenSaniye?: number;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-kum-200 bg-white p-3.5">
      <p className="flex items-center gap-2 text-sm font-medium text-kum-800">
        <Loader2 className="size-4 animate-spin text-zumrut-600" aria-hidden />
        <span className="min-w-0 flex-1">{metin}</span>
        {gecenSaniye && gecenSaniye > 2 ? (
          <span className="shrink-0 font-mono text-xs tabular-nums font-normal text-kum-400">
            {formatDuration(gecenSaniye)}
          </span>
        ) : null}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-kum-200">
        <div
          className={
            oran === null
              ? "h-full w-1/3 animate-pulse rounded-full bg-zumrut-400"
              : "h-full rounded-full bg-zumrut-600 transition-[width]"
          }
          style={oran === null ? undefined : { width: `${Math.round(oran * 100)}%` }}
        />
      </div>
      {not ? <p className="text-xs text-kum-500">{not}</p> : null}
    </div>
  );
}
