import Link from "next/link";

import { OYUN_TURLERI, type OyunTuru } from "@/modules/game/types";

/**
 * Oyun listesindeki kart.
 *
 * Kartın TAMAMI renkli: ince bir üst çizgi yerine tür rengiyle boyanmış,
 * üzerinde hareketli çizgi dokusu, süzülen büyük emoji ve hover'da geçen ışık
 * parıltısı olan bir yüzey. Oyun alanı sitenin geri kalanından ayrışsın diye.
 */
export function OyunKarti({
  href,
  type,
  baslik,
  altYazi,
  gecikmeMs = 0,
  rozet,
}: {
  href: string;
  type: OyunTuru;
  baslik: string;
  altYazi?: string | null;
  gecikmeMs?: number;
  rozet?: string;
}) {
  const tur = OYUN_TURLERI[type];

  return (
    <Link
      href={href}
      className="oyun-yukari oyun-parilti-kabi group block rounded-card p-4 text-white shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1 sm:p-5"
      style={{ background: tur.renk, animationDelay: `${gecikmeMs}ms` }}
    >
      <span className="oyun-zemin absolute inset-0 opacity-40" aria-hidden />

      <span className="relative flex items-start gap-3">
        <span
          className="oyun-suzul grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm"
          style={{ animationDelay: `${gecikmeMs}ms` }}
          aria-hidden
        >
          {tur.simge}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
              {tur.ad}
            </span>
            {rozet ? (
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-semibold">
                {rozet}
              </span>
            ) : null}
          </span>

          <span className="mt-1.5 block text-lg font-bold leading-tight drop-shadow-sm">
            {baslik}
          </span>

          {altYazi ? (
            <span className="mt-0.5 block text-sm text-white/85">{altYazi}</span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
