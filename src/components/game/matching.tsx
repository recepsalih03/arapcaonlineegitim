"use client";

import { useMemo, useState } from "react";

import { BasariKutusu, Konfeti } from "@/components/game/celebration";
import { PuanCubugu } from "@/components/game/score-bar";
import { useIlerleme } from "@/components/game/use-progress";
import { cn } from "@/lib/utils";

/** Eşleşen çiftler kendi renklerini alsın: hangi kutu neyle eşleşti belli olsun. */
const CIFT_RENKLERI = [
  "var(--color-oyun-firuze)",
  "var(--color-oyun-lacivert)",
  "var(--color-oyun-firuze)",
  "var(--color-oyun-altin)",
  "var(--color-oyun-zumrut)",
  "var(--color-oyun-mercan)",
];

/**
 * Eşleştirme: soldan bir kutu, sağdan karşılığı seçilir.
 *
 * Sağ sütun karıştırılır ama karıştırma SUNUCUDA değil, ilk render'dan sonra
 * yapılır: sunucu ve istemci farklı sıra üretirse hydration uyuşmazlığı olur.
 */
export function EslestirmeOyunu({
  gameId,
  ciftler,
  arapca,
}: {
  /** null ise ilerleme kaydedilmez (admin önizlemesi). */
  gameId: string | null;
  ciftler: Array<{ soru: string; cevap: string }>;
  arapca: boolean;
}) {
  const ilerlemeBildir = useIlerleme(gameId);
  const [tohum, setTohum] = useState(1);
  const [seciliSol, setSeciliSol] = useState<number | null>(null);
  const [eslesen, setEslesen] = useState<Set<number>>(new Set());
  const [yanlis, setYanlis] = useState<number | null>(null);
  const [tur, setTur] = useState(0);

  // Deterministik karıştırma: aynı tohum aynı sırayı verir, "Baştan" deyince
  // tohum değişip yeni bir sıra çıkar.
  const sagSira = useMemo(() => {
    const sira = ciftler.map((_, i) => i);
    let x = tohum * 9301 + 49297;
    for (let i = sira.length - 1; i > 0; i--) {
      x = (x * 9301 + 49297) % 233280;
      const j = Math.floor((x / 233280) * (i + 1));
      [sira[i], sira[j]] = [sira[j], sira[i]];
    }
    return sira;
  }, [ciftler, tohum]);

  const bitti = eslesen.size === ciftler.length;

  function sagSec(index: number) {
    if (seciliSol === null || eslesen.has(index)) return;

    if (seciliSol === index) {
      const yeni = new Set(eslesen).add(index);
      setEslesen(yeni);
      setSeciliSol(null);
      ilerlemeBildir(yeni.size, ciftler.length);
      if (yeni.size === ciftler.length) setTur((t) => t + 1);
      return;
    }

    setYanlis(index);
    setTimeout(() => setYanlis(null), 450);
    setSeciliSol(null);
  }

  function sifirla() {
    setEslesen(new Set());
    setSeciliSol(null);
    setTohum((t) => t + 1);
  }

  return (
    <div className="relative space-y-5">
      <Konfeti tetik={tur} />
      <PuanCubugu
        dogru={eslesen.size}
        toplam={ciftler.length}
        bitti={bitti}
        onSifirla={sifirla}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="space-y-2.5">
          {ciftler.map((cift, i) => (
            <Kutu
              key={i}
              metin={cift.soru}
              arapca={arapca}
              renk={CIFT_RENKLERI[i % CIFT_RENKLERI.length]}
              durum={
                eslesen.has(i) ? "eslesti" : seciliSol === i ? "secili" : "bos"
              }
              onClick={() => !eslesen.has(i) && setSeciliSol(i)}
            />
          ))}
        </div>

        <div className="space-y-2.5">
          {sagSira.map((index) => (
            <Kutu
              key={index}
              metin={ciftler[index].cevap}
              arapca={arapca}
              renk={CIFT_RENKLERI[index % CIFT_RENKLERI.length]}
              durum={
                eslesen.has(index)
                  ? "eslesti"
                  : yanlis === index
                    ? "yanlis"
                    : "bos"
              }
              pasif={seciliSol === null}
              onClick={() => sagSec(index)}
            />
          ))}
        </div>
      </div>

      {bitti ? (
        <BasariKutusu
          baslik="Hepsini eşleştirdin!"
          altYazi={`${ciftler.length} çiftin tamamı doğru.`}
        />
      ) : (
        <p className="text-center text-sm font-medium text-kum-500">
          {seciliSol === null
            ? "👈 Soldan bir kutu seç."
            : "👉 Şimdi sağdan karşılığını seç."}
        </p>
      )}
    </div>
  );
}

function Kutu({
  metin,
  arapca,
  renk,
  durum,
  pasif = false,
  onClick,
}: {
  metin: string;
  arapca: boolean;
  renk: string;
  durum: "bos" | "secili" | "eslesti" | "yanlis";
  pasif?: boolean;
  onClick: () => void;
}) {
  const renkli = durum === "secili" || durum === "eslesti";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={durum === "eslesti"}
      dir={arapca ? "rtl" : "ltr"}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border-2 px-3 py-3.5 text-center text-[15px] font-semibold shadow-sm transition-all duration-200",
        arapca && "text-lg",
        durum === "bos" &&
          cn(
            "border-kum-200 bg-white text-kum-800",
            pasif
              ? "opacity-70"
              : "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
          ),
        durum === "secili" && "oyun-nabiz scale-[1.03] border-transparent text-white",
        durum === "eslesti" && "oyun-pop border-transparent text-white",
        durum === "yanlis" &&
          "oyun-sarsil border-oyun-yanlis bg-oyun-yanlis/15 text-kum-900",
      )}
      style={
        renkli
          ? { background: renk, ["--nabiz-renk" as string]: renk }
          : durum === "bos" && !pasif
            ? { borderColor: `color-mix(in srgb, ${renk} 35%, transparent)` }
            : undefined
      }
    >
      {durum === "eslesti" ? (
        <span className="oyun-zemin absolute inset-0 opacity-40" aria-hidden />
      ) : null}
      <span className="relative">{metin}</span>
      {durum === "eslesti" ? (
        <span className="absolute right-2 top-1.5 text-xs" aria-hidden>
          ✓
        </span>
      ) : null}
    </button>
  );
}
