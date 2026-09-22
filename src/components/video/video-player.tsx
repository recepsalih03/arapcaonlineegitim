"use client";

import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useIzlemeKaydi } from "@/components/video/use-watch-progress";
import { formatDuration } from "@/lib/utils";

/**
 * HLS oynatıcı (PROJE.md §1, §2d).
 *
 * Koruma katmanları — hepsi "caydırıcı", DRM değil:
 *  - Kaynak hls.js üzerinden MSE ile beslenir; <video> etiketinin src'si
 *    blob: adresidir, gerçek playlist adresi DOM'da durmaz.
 *  - controlsList="nodownload", indirme menüsü kapalı, sağ tık engelli.
 *  - Playlist her istekte yeniden imzalanır, segment linkleri birkaç dakikada
 *    ölür (bkz. src/app/api/videos/[id]/hls).
 *
 * Ekran kaydı bu yöntemlerle ENGELLENEMEZ; şartname bunu kapsam dışı sayıyor.
 *
 * Safari/iOS istisnası: bu tarayıcılar HLS'i yerel olarak oynatır, MSE yolu
 * kullanılamaz; orada playlist adresi src olarak verilmek zorundadır. Adres yine
 * kısa ömürlü ve yetki kontrollüdür.
 */

/** Sunulan oynatma hızları. 1 = normal. */
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** İleri/geri alma miktarı (saniye). */
const ATLAMA_SANIYE = 10;

type VideoPlayerProps = {
  /** Playlist proxy adresi: /api/videos/<id>/hls/<playlist>.m3u8 */
  src: string;
  poster?: string | null;
  title: string;
  /**
   * İzleme ilerlemesi bu video için kaydedilsin mi?
   * null = kaydetme (admin önizlemesi, girişsiz public izleme).
   */
  videoId?: string | null;
  /** Kaldığı yerden devam etsin diye başlangıç saniyesi. */
  baslangicSaniye?: number;
};

export function VideoPlayer({
  src,
  poster,
  title,
  videoId = null,
  baslangicSaniye = 0,
}: VideoPlayerProps) {
  const { bildir, kaydet } = useIzlemeKaydi(videoId);
  const baslangicUygulandi = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [speedMenu, setSpeedMenu] = useState(false);

  // --- Kaynağı bağla -------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    // hls.js dinamik import edildiği için tipi burada bilinmiyor.
    let hls: import("hls.js").default | null = null;
    /*
     * Ağ hatasında playlist'i yeniden yüklüyoruz çünkü imzalı segment
     * linkleri birkaç dakikada ölüyor. Ama SINIRSIZ denemek, CORS gibi kalıcı
     * hataları sessiz bir donmaya çeviriyordu: oynatıcı 0:00'da bekliyor,
     * kullanıcı sebebini hiç öğrenemiyordu.
     */
    let agDenemesi = 0;
    const AZAMI_AG_DENEMESI = 3;

    async function attach() {
      if (!video) return;

      const { default: Hls } = await import("hls.js");
      if (destroyed) return;

      // SIRA ÖNEMLİ: önce hls.js (MSE), sonra yerel HLS.
      //
      // Tersi denenmişti ve hatalıydı: bazı tarayıcılar
      // canPlayType("application/vnd.apple.mpegurl") için "maybe" döndürüyor ama
      // HLS'i aslında yerel olarak OYNATAMIYOR (Chrome'un bazı sürümleri böyle).
      // O yanıta güvenilince src doğrudan playlist'e ayarlanıyor ve video hiç
      // açılmıyordu — readyState 0'da kalıyordu.
      //
      // MSE yolu ayrıca daha güvenli: <video> etiketinin src'si blob: adresi
      // olduğu için gerçek playlist adresi DOM'da durmuyor.
      if (Hls.isSupported()) {
        const ornek = new Hls({
          // Segment linkleri kısa ömürlü; playlist'i sık tazele ki link ölmesin.
          lowLatencyMode: false,
          enableWorker: true,
          maxBufferLength: 30,
          /*
           * hls.js'in KENDİ yeniden deneme bütçesini kısıyoruz.
           * Varsayılanı 6 deneme + artan bekleme: CORS gibi kalıcı bir hatada
           * "ölümcül hata" olayı dakikalarca gelmiyor, o süre boyunca oynatıcı
           * 0:00'da sessizce bekliyordu. 2 deneme ile birkaç saniyede öğreniyoruz.
           */
          fragLoadPolicy: {
            default: {
              maxTimeToFirstByteMs: 10_000,
              maxLoadTimeMs: 60_000,
              timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
              errorRetry: { maxNumRetry: 2, retryDelayMs: 500, maxRetryDelayMs: 2000 },
            },
          },
        });
        hls = ornek;
        ornek.loadSource(src);
        ornek.attachMedia(video);
        ornek.on(Hls.Events.MANIFEST_PARSED, () => setReady(true));
        ornek.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;

          if (data.type === "networkError" && agDenemesi < AZAMI_AG_DENEMESI) {
            // İmzalı link süresi dolmuş veya geçici ağ hatası: pozisyonu koruyarak playlist'i yenile.
            agDenemesi++;
            const sonZaman = video.currentTime;
            ornek.loadSource(src);
            ornek.startLoad(sonZaman);
            if (sonZaman > 0) {
              const onTazelendi = () => {
                video.currentTime = sonZaman;
                ornek.off(Hls.Events.MANIFEST_PARSED, onTazelendi);
              };
              ornek.on(Hls.Events.MANIFEST_PARSED, onTazelendi);
            }
            return;
          }

          if (data.type === "networkError") {
            // Playlist geliyor ama parçalar gelmiyorsa neredeyse her zaman
            // depolama tarafındaki CORS ayarı eksiktir.
            setError(
              "Video parçaları yüklenemedi. Bağlantınızı kontrol edip sayfayı " +
                "yenileyin; sorun sürerse öğretmeninize bildirin.",
            );
            return;
          }

          setError("Video yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
        });
        return;
      }

      // MSE yoksa (iOS Safari) yerel HLS'e düş.
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        setReady(true);
        return;
      }

      setError("Tarayıcınız bu video biçimini desteklemiyor.");
    }

    void attach();

    return () => {
      destroyed = true;
      if (hls) hls.destroy();
    };
  }, [src]);

  // --- Oynatıcı olayları ---------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      setCurrent(video.currentTime);
      bildir(video.currentTime, video.duration || 0);
    };
    const onDuration = () => setDuration(video.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      kaydet(true);
    };
    const onEnded = () => kaydet(true);
    // Kaldığı yere ancak süre bilindikten sonra atlanabilir.
    const onHazir = () => {
      if (baslangicUygulandi.current) return;
      baslangicUygulandi.current = true;
      if (
        baslangicSaniye > 0 &&
        video.duration > 0 &&
        // Sona çok yakınsa baştan başlasın: bitmiş videoyu son saniyesinden
        // açmak faydasız.
        baslangicSaniye < video.duration - 5
      ) {
        video.currentTime = baslangicSaniye;
      }
    };
    const onVolume = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onRate = () => setRate(video.playbackRate);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("loadedmetadata", onHazir);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("ratechange", onRate);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("loadedmetadata", onHazir);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("ratechange", onRate);
    };
  }, [bildir, kaydet, baslangicSaniye]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // --- Kontroller ----------------------------------------------------------
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Sesi tamamen kısıkken sesi açmak, ses seviyesi 0 olduğu için hiçbir şey
    // yapmıyormuş gibi görünürdü; o durumda makul bir seviyeye çıkarıyoruz.
    if (video.muted && video.volume === 0) video.volume = 0.5;
    video.muted = !video.muted;
  }, []);

  const changeVolume = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const seviye = Math.min(1, Math.max(0, value));
    video.volume = seviye;
    // Sürgüyü sıfıra çekmek "sessize al" demektir; yukarı çekmek de açmak.
    video.muted = seviye === 0;
    setVolume(seviye);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }
    if (container.requestFullscreen) {
      await container.requestFullscreen().catch(() => undefined);
      return;
    }
    // iOS Safari tam ekranı yalnızca <video> üzerinden veriyor.
    const legacy = video as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    legacy?.webkitEnterFullscreen?.();
  }, []);

  const seek = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrent(value);
  }, []);

  // Göreli atlama (±10 sn), 0 ile video süresi arasında sınırlanır.
  const skip = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const sinir = video.duration || 0;
    const hedef = Math.min(sinir, Math.max(0, video.currentTime + delta));
    video.currentTime = hedef;
    setCurrent(hedef);
  }, []);

  const changeRate = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = value;
    setRate(value);
    setSpeedMenu(false);
  }, []);

  // Klavye: ← → 10 sn atlar, boşluk/K oynat-duraklat. Odak bir sürgüdeyse
  // (ses/konum) ok tuşları sürgünün kendi işine kalsın diye karışmıyoruz.
  const onKey = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).tagName === "INPUT") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        skip(-ATLAMA_SANIYE);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        skip(ATLAMA_SANIYE);
      } else if (event.key === " " || event.key === "k") {
        event.preventDefault();
        togglePlay();
      }
    },
    [skip, togglePlay],
  );

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-card bg-kum-900 shadow-sm outline-none"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={onKey}
      tabIndex={0}
      aria-label={`Video oynatıcı: ${title}`}
    >
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onClick={() => {
          // Hız menüsü açıksa önce onu kapat, videoyu oynatma/duraklatma.
          if (speedMenu) setSpeedMenu(false);
          else togglePlay();
        }}
        className="aspect-video w-full bg-black"
        aria-label={title}
      />

      {!ready && !error ? (
        <div className="absolute inset-0 grid place-items-center bg-kum-900/70">
          <Loader2 className="size-7 animate-spin text-white/80" aria-hidden />
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-kum-900/85 px-6 text-center">
          <p className="text-sm text-white/90">{error}</p>
        </div>
      ) : null}

      {/* Kontrol çubuğu — mobilde her zaman görünür, masaüstünde hover ile. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Video konumu"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-altin-300 [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-altin-300"
          style={{
            background: `linear-gradient(to right, var(--color-altin-300) ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
          }}
        />

        <div className="mt-2 flex items-center gap-1 text-white sm:gap-2">
          <button
            type="button"
            onClick={() => skip(-ATLAMA_SANIYE)}
            aria-label="10 saniye geri"
            className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-white/15"
          >
            <RotateCcw className="size-5" aria-hidden />
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-[7px] font-bold tabular-nums">
              10
            </span>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Duraklat" : "Oynat"}
            className="grid size-10 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            {playing ? (
              <Pause className="size-5" aria-hidden />
            ) : (
              <Play className="size-5 translate-x-px" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={() => skip(ATLAMA_SANIYE)}
            aria-label="10 saniye ileri"
            className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-white/15"
          >
            <RotateCw className="size-5" aria-hidden />
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-[7px] font-bold tabular-nums">
              10
            </span>
          </button>

          {/*
            Ses sürgüsü yalnızca ince işaretçili cihazlarda (fare) görünür:
            iOS'ta <video>.volume salt okunurdur, ses donanım tuşlarıyla
            ayarlanır. Telefonda çalışmayan bir sürgü göstermek yanıltıcı olur.
          */}
          <div className="group/ses flex items-center">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Sesi aç" : "Sesi kapat"}
              className="grid size-10 place-items-center rounded-full transition-colors hover:bg-white/15"
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-5" aria-hidden />
              ) : volume < 0.5 ? (
                <Volume1 className="size-5" aria-hidden />
              ) : (
                <Volume2 className="size-5" aria-hidden />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(olay) => changeVolume(Number(olay.target.value))}
              aria-label="Ses seviyesi"
              className="ses-surgusu h-1 w-0 cursor-pointer appearance-none rounded-full opacity-0 transition-all duration-150 group-hover/ses:w-20 group-hover/ses:opacity-100 focus-visible:w-20 focus-visible:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              style={{
                background: `linear-gradient(to right, #fff ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>

          <span className="ml-1 shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-white/85 sm:text-xs">
            {formatDuration(current)} / {formatDuration(duration)}
          </span>

          {/* Oynatma hızı: butona basınca üstünde küçük menü açılır.
              Kompakt 2 sütunlu ızgara — mobilde video kısa olduğu için tek
              sütun uzun menü kabın overflow-hidden'ına takılıp kırpılıyordu. */}
          <div className="relative ml-auto">
            {speedMenu ? (
              <div
                className="absolute bottom-full right-0 mb-2 grid w-40 grid-cols-2 gap-1 rounded-xl bg-kum-900/95 p-1.5 shadow-lg ring-1 ring-white/10"
                role="menu"
                aria-label="Oynatma hızı"
              >
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitemradio"
                    aria-checked={rate === s}
                    onClick={() => changeRate(s)}
                    className={`rounded-lg px-3 py-1.5 text-center text-sm tabular-nums transition-colors hover:bg-white/15 ${
                      rate === s
                        ? "bg-white/10 font-bold text-altin-300"
                        : "text-white/90"
                    }`}
                  >
                    {s === 1 ? "1×" : `${s}×`}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSpeedMenu((a) => !a)}
              aria-label="Oynatma hızı"
              aria-haspopup="menu"
              aria-expanded={speedMenu}
              className={`grid h-10 min-w-10 place-items-center rounded-full px-2 text-xs font-semibold tabular-nums transition-colors hover:bg-white/15 ${
                rate !== 1 ? "text-altin-300" : ""
              }`}
            >
              {rate === 1 ? "1×" : `${rate}×`}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Tam ekrandan çık" : "Tam ekran"}
            className="grid size-10 place-items-center rounded-full transition-colors hover:bg-white/15"
          >
            {fullscreen ? (
              <Minimize className="size-5" aria-hidden />
            ) : (
              <Maximize className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
