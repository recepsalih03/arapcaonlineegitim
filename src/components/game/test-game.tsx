"use client";

import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";

import { BasariKutusu, Konfeti } from "@/components/game/celebration";
import { PuanCubugu } from "@/components/game/score-bar";
import { useIlerleme } from "@/components/game/use-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HARFLER = ["A", "B", "C", "D"] as const;

export function TestOyunu({
  gameId,
  sorular,
  arapca,
}: {
  /** null ise ilerleme kaydedilmez (admin önizlemesi). */
  gameId: string | null;
  sorular: Array<{
    soru: string;
    secenekler: [string, string, string, string];
    dogruIndex: number;
  }>;
  arapca: boolean;
}) {
  const ilerlemeBildir = useIlerleme(gameId);

  const [aktifIndex, setAktifIndex] = useState(0);
  const [secilenler, setSecilenler] = useState<Record<number, number>>({});
  const [tur, setTur] = useState(0);

  const toplam = sorular.length;
  const aktifSoru = sorular[aktifIndex];

  // Doğru cevap sayısı
  const dogruSayisi = useMemo(() => {
    let count = 0;
    for (let i = 0; i < toplam; i++) {
      if (secilenler[i] === sorular[i].dogruIndex) {
        count++;
      }
    }
    return count;
  }, [secilenler, sorular, toplam]);

  const cevaplananSayisi = Object.keys(secilenler).length;
  const bitti = toplam > 0 && cevaplananSayisi === toplam;

  function secimYap(secenekIndex: number) {
    if (secilenler[aktifIndex] !== undefined) return; // Zaten cevaplandı

    const yeniSecilenler = { ...secilenler, [aktifIndex]: secenekIndex };
    setSecilenler(yeniSecilenler);

    let yeniDogru = 0;
    for (let i = 0; i < toplam; i++) {
      if (yeniSecilenler[i] === sorular[i].dogruIndex) {
        yeniDogru++;
      }
    }

    ilerlemeBildir(yeniDogru, toplam);

    if (Object.keys(yeniSecilenler).length === toplam) {
      setTur((t) => t + 1);
    }
  }

  function sifirla() {
    setSecilenler({});
    setAktifIndex(0);
  }

  if (toplam === 0) {
    return (
      <div className="rounded-xl border border-kum-200 bg-white p-6 text-center text-kum-500">
        Bu teste henüz soru eklenmemiş.
      </div>
    );
  }

  const suankiCevaplandi = secilenler[aktifIndex] !== undefined;
  const suankiSecim = secilenler[aktifIndex];
  const suankiDogruMu = suankiSecim === aktifSoru.dogruIndex;

  return (
    <div className="relative space-y-6">
      <Konfeti tetik={tur} />

      <PuanCubugu
        dogru={dogruSayisi}
        toplam={toplam}
        bitti={bitti}
        onSifirla={sifirla}
      />

      {/* Soru Seçim Butonları / Navigasyon İpuçları */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {sorular.map((_, i) => {
          const cevaplandi = secilenler[i] !== undefined;
          const dogru = secilenler[i] === sorular[i].dogruIndex;
          const secili = i === aktifIndex;

          return (
            <button
              key={i}
              type="button"
              onClick={() => setAktifIndex(i)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all sm:size-9 sm:text-sm",
                secili && "ring-2 ring-zumrut-700 ring-offset-2",
                !cevaplandi && "border border-kum-200 bg-white text-kum-700 hover:bg-kum-50",
                cevaplandi &&
                  dogru &&
                  "bg-oyun-dogru text-white shadow-xs",
                cevaplandi &&
                  !dogru &&
                  "bg-oyun-yanlis text-white shadow-xs",
              )}
              aria-label={`${i + 1}. soru`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {bitti && (
        <BasariKutusu
          baslik={`Tebrikler! ${dogruSayisi} / ${toplam} Doğru`}
          altYazi={`Testi tamamladınız. Başarı oranı: %${Math.round(
            (dogruSayisi / toplam) * 100,
          )}`}
        />
      )}

      {/* Soru Kartı */}
      <div
        className="rounded-card p-[3px] shadow-md"
        style={{
          background:
            "linear-gradient(135deg, var(--color-oyun-lacivert), var(--color-oyun-firuze))",
        }}
      >
        <div className="rounded-[calc(var(--radius-card)-3px)] bg-white p-5 sm:p-7">
          {/* Soru Üst Bilgisi */}
          <div className="mb-4 flex items-center justify-between border-b border-kum-100 pb-3">
            <span className="rounded-full bg-lacivert-50 px-3 py-1 text-xs font-bold text-lacivert-800">
              Soru {aktifIndex + 1} / {toplam}
            </span>

            {suankiCevaplandi && (
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs font-bold",
                  suankiDogruMu ? "text-oyun-dogru" : "text-oyun-yanlis",
                )}
              >
                {suankiDogruMu ? (
                  <>
                    <Check className="size-4" /> Doğru Cevap
                  </>
                ) : (
                  <>
                    <X className="size-4" /> Yanlış Cevap
                  </>
                )}
              </span>
            )}
          </div>

          {/* Soru Metni */}
          <div
            dir={arapca ? "rtl" : "ltr"}
            className={cn(
              "mb-6 text-kum-900 leading-relaxed font-medium",
              arapca ? "text-right text-xl sm:text-2xl" : "text-base sm:text-lg",
            )}
          >
            {aktifSoru.soru}
          </div>

          {/* 4 Şık */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aktifSoru.secenekler.map((secenek, oIdx) => {
              const secildi = suankiSecim === oIdx;
              const dogruSik = oIdx === aktifSoru.dogruIndex;

              let durumSinifi =
                "border-kum-200 bg-white text-kum-800 hover:border-kum-400 hover:bg-kum-50/50";
              let harfSinifi = "bg-kum-100 text-kum-700";

              if (suankiCevaplandi) {
                if (dogruSik) {
                  durumSinifi =
                    "border-oyun-dogru bg-emerald-50/70 text-emerald-950 ring-2 ring-oyun-dogru/40 shadow-xs";
                  harfSinifi = "bg-oyun-dogru text-white";
                } else if (secildi && !dogruSik) {
                  durumSinifi =
                    "border-oyun-yanlis bg-rose-50/70 text-rose-950 ring-1 ring-oyun-yanlis/30 shadow-xs";
                  harfSinifi = "bg-oyun-yanlis text-white";
                } else {
                  durumSinifi = "border-kum-100 bg-kum-50/30 text-kum-400 opacity-60";
                  harfSinifi = "bg-kum-100 text-kum-400";
                }
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => secimYap(oIdx)}
                  disabled={suankiCevaplandi}
                  dir={arapca ? "rtl" : "ltr"}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all",
                    durumSinifi,
                    !suankiCevaplandi && "cursor-pointer active:scale-[0.99]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                      harfSinifi,
                    )}
                  >
                    {suankiCevaplandi && dogruSik ? (
                      <Check className="size-4" />
                    ) : suankiCevaplandi && secildi && !dogruSik ? (
                      <X className="size-4" />
                    ) : (
                      HARFLER[oIdx]
                    )}
                  </span>

                  <span
                    className={cn(
                      "flex-1 font-medium",
                      arapca ? "text-right text-lg" : "text-sm sm:text-base",
                    )}
                  >
                    {secenek}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alt Gezinme Butonları */}
          <div className="mt-7 flex items-center justify-between border-t border-kum-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={aktifIndex === 0}
              onClick={() => setAktifIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-4" />
              Önceki Soru
            </Button>

            {aktifIndex < toplam - 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAktifIndex((i) => Math.min(toplam - 1, i + 1))}
              >
                Sonraki Soru
                <ChevronRight className="size-4" />
              </Button>
            ) : bitti ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={sifirla}
              >
                <RotateCcw className="size-4" />
                Yeniden Çöz
              </Button>
            ) : (
              <span className="text-xs text-kum-400">
                Tüm soruları tamamlayın
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
