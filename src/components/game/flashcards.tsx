"use client";

import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useState } from "react";

import { useIlerleme } from "@/components/game/use-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Her kart farklı bir renk çiftiyle gelsin; sırayla dönerler. */
const ON_RENKLER = [
  "linear-gradient(135deg, var(--color-oyun-firuze), var(--color-oyun-lacivert))",
  "linear-gradient(135deg, var(--color-oyun-mercan), var(--color-oyun-altin))",
  "linear-gradient(135deg, var(--color-oyun-lacivert), var(--color-oyun-firuze))",
];
const ARKA_RENKLER = [
  "linear-gradient(135deg, var(--color-oyun-firuze), var(--color-oyun-zumrut))",
  "linear-gradient(135deg, var(--color-oyun-zumrut), var(--color-oyun-firuze))",
  "linear-gradient(135deg, var(--color-oyun-lacivert), var(--color-oyun-mercan))",
];

/**
 * Kart oyunu: tıklayınca 3B çevrilen kartlar.
 * İlerleme "kaç kartı gördün" üzerinden; doğru/yanlış yok, ezber aracı.
 */
export function KartOyunu({
  gameId,
  ciftler,
  arapca,
}: {
  /** null ise ilerleme kaydedilmez (admin önizlemesi). */
  gameId: string | null;
  ciftler: Array<{ soru: string; cevap: string }>;
  arapca: boolean;
}) {
  // Kartta doğru/yanlış yok; ilerleme "kaç kartı gördü" üzerinden ölçülür.
  const ilerlemeBildir = useIlerleme(gameId);
  const [index, setIndex] = useState(0);
  const [cevrik, setCevrik] = useState(false);
  const [gorulen, setGorulen] = useState<Set<number>>(new Set([0]));

  const kart = ciftler[index];

  function git(yon: 1 | -1) {
    const yeni = (index + yon + ciftler.length) % ciftler.length;
    // Güncel "görülen" kümesini updater DIŞINDA hesaplıyoruz. İlerleme bildirimi
    // bir server action tetikliyor; setState updater'ının içinde çağrılırsa
    // render sırasında Router güncellemesi olur ("Cannot update a component
    // while rendering a different component"). Updater saf kalmalı.
    const guncel = new Set(gorulen).add(yeni);
    setCevrik(false);
    setIndex(yeni);
    setGorulen(guncel);
    ilerlemeBildir(guncel.size, ciftler.length);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-oyun-firuze/10 px-3 py-1 text-sm font-bold tabular-nums text-oyun-firuze">
          {index + 1} / {ciftler.length}
        </span>
        <span className="text-sm font-medium text-kum-500">
          {gorulen.size === ciftler.length ? "🎉 " : "👀 "}
          {gorulen.size} kart görüldü
        </span>
      </div>

      {/* Kaçıncı karttayız — küçük noktalar. */}
      <div className="flex justify-center gap-1.5">
        {ciftler.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index
                ? "w-6 bg-oyun-firuze"
                : gorulen.has(i)
                  ? "w-1.5 bg-oyun-dogru"
                  : "w-1.5 bg-kum-300",
            )}
            aria-hidden
          />
        ))}
      </div>

      <div className="kart-sahne">
        <button
          type="button"
          onClick={() => setCevrik((c) => !c)}
          aria-label={cevrik ? "Ön yüzü göster" : "Arka yüzü göster"}
          className="block h-60 w-full sm:h-72"
        >
          <div className={cn("kart-ic h-full w-full", cevrik && "cevrik")}>
            <KartYuzu
              metin={kart.soru}
              arapca={arapca}
              renk={ON_RENKLER[index % ON_RENKLER.length]}
              etiket="Ön yüz"
              ipucu="Çevirmek için dokun"
            />
            <KartYuzu
              metin={kart.cevap}
              arapca={arapca}
              renk={ARKA_RENKLER[index % ARKA_RENKLER.length]}
              etiket="Arka yüz"
              arka
            />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={() => git(-1)}>
          <ChevronLeft className="size-4" aria-hidden />
          Önceki
        </Button>
        <Button type="button" variant="ghost" onClick={() => setCevrik((c) => !c)}>
          <RotateCw className="size-4" aria-hidden />
          Çevir
        </Button>
        <Button type="button" variant="secondary" onClick={() => git(1)}>
          Sonraki
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function KartYuzu({
  metin,
  arapca,
  renk,
  etiket,
  ipucu,
  arka = false,
}: {
  metin: string;
  arapca: boolean;
  renk: string;
  etiket: string;
  ipucu?: string;
  arka?: boolean;
}) {
  return (
    <div
      className={cn(
        "kart-yuz grid place-items-center overflow-hidden rounded-card p-6 text-white shadow-xl",
        arka && "kart-arka",
      )}
      style={{ background: renk }}
    >
      <span className="oyun-zemin absolute inset-0 opacity-35" aria-hidden />

      <div className="relative text-center">
        <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
          {etiket}
        </span>
        <p
          dir={arapca ? "rtl" : "ltr"}
          className={cn(
            "mt-3 font-bold drop-shadow-sm",
            arapca ? "text-4xl leading-relaxed" : "text-3xl",
          )}
        >
          {metin}
        </p>
        {ipucu ? (
          <p className="mt-3 text-xs text-white/70">{ipucu}</p>
        ) : null}
      </div>
    </div>
  );
}
