import { OYUN_TURLERI, type OyunTuru } from "@/modules/game/types";

/**
 * Oyun sayfasının üst bandı: ince çizgi değil, tür rengiyle boyanmış,
 * arkasında dönen ışık ve hareketli doku olan bir başlık alanı.
 */
export function OyunBasligi({
  type,
  baslik,
  altYazi,
}: {
  type: OyunTuru;
  baslik: string;
  altYazi?: string | null;
}) {
  const tur = OYUN_TURLERI[type];

  return (
    <div
      className="oyun-isik relative overflow-hidden rounded-card p-5 text-white shadow-lg sm:p-6"
      style={{ background: tur.renk }}
    >
      <span className="oyun-zemin absolute inset-0 opacity-40" aria-hidden />

      <div className="relative flex items-center gap-4">
        <span
          className="oyun-suzul grid size-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm"
          aria-hidden
        >
          {tur.simge}
        </span>
        <div className="min-w-0">
          <p className="inline-block rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
            {tur.ad}
          </p>
          <h1 className="mt-1 text-xl font-bold leading-tight drop-shadow-sm sm:text-2xl">
            {baslik}
          </h1>
          {altYazi ? (
            <p className="mt-0.5 text-sm text-white/85">{altYazi}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
