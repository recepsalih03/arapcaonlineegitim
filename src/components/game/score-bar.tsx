"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Oyunların ortak üst şeridi: ilerleme, puan ve baştan başlatma. */
export function PuanCubugu({
  dogru,
  toplam,
  bitti,
  onSifirla,
}: {
  dogru: number;
  toplam: number;
  bitti: boolean;
  onSifirla: () => void;
}) {
  const oran = toplam === 0 ? 0 : (dogru / toplam) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-kum-700">
          <span
            className={cn("text-lg", bitti && "oyun-zipla inline-block")}
            aria-hidden
          >
            {bitti ? "🏆" : oran > 50 ? "🔥" : "⭐"}
          </span>
          <span className="tabular-nums">
            {dogru} / {toplam}
          </span>
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onSifirla}>
          <RotateCcw className="size-4" aria-hidden />
          Baştan
        </Button>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-full bg-kum-200 shadow-inner"
        role="progressbar"
        aria-valuenow={dogru}
        aria-valuemin={0}
        aria-valuemax={toplam}
        aria-label="İlerleme"
      >
        <div
          className="relative h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${oran}%`,
            background: bitti
              ? "linear-gradient(90deg, var(--color-oyun-zumrut), var(--color-oyun-firuze))"
              : "linear-gradient(90deg, var(--color-oyun-firuze), var(--color-oyun-lacivert), var(--color-oyun-mercan))",
          }}
        >
          {/* Çubuğun üstünde akan çizgiler: ilerleme "canlı" hissettirsin. */}
          <span className="oyun-zemin absolute inset-0 rounded-full opacity-60" aria-hidden />
        </div>
      </div>
    </div>
  );
}
