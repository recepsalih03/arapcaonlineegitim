import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Video listesindeki izleme göstergesi: ince bir ilerleme çubuğu, tamamlandıysa
 * onay rozeti. Öğrenci hangi videoyu bitirdiğini listeden görebilsin diye.
 */
export function IzlemeCubugu({
  positionSec,
  durationSec,
  tamamlandi,
  className,
}: {
  positionSec: number;
  durationSec: number;
  tamamlandi: boolean;
  className?: string;
}) {
  const yuzde =
    durationSec > 0
      ? Math.min(100, Math.round((positionSec / durationSec) * 100))
      : 0;

  if (yuzde === 0 && !tamamlandi) return null;

  return (
    <span className={cn("mt-1.5 flex items-center gap-2", className)}>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-kum-200">
        <span
          className={cn(
            "block h-full rounded-full",
            tamamlandi ? "bg-zumrut-600" : "bg-altin-400",
          )}
          style={{ width: `${tamamlandi ? 100 : yuzde}%` }}
        />
      </span>
      <span
        className={cn(
          "shrink-0 text-[11px] font-medium",
          tamamlandi ? "text-zumrut-700" : "text-kum-500",
        )}
      >
        {tamamlandi ? (
          <span className="flex items-center gap-0.5">
            <Check className="size-3" aria-hidden />
            İzlendi
          </span>
        ) : (
          `%${yuzde}`
        )}
      </span>
    </span>
  );
}
