import type { SurveyResults } from "@/modules/surveys/service";

/**
 * Anket sonuç dökümü — YALNIZCA admin panelinde gösterilir (PROJE.md §7).
 * Sayılar toplamdır; kimin ne oyladığı veritabanında zaten tutulmaz.
 */
export function SurveyResultsChart({ results }: { results: SurveyResults }) {
  if (results.totalVotes === 0) {
    return <p className="text-sm text-kum-500">Henüz oy verilmemiş.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-kum-500">Toplam {results.totalVotes} oy</p>
      <ul className="space-y-2.5">
        {results.options.map((option) => {
          const percent = Math.round(option.ratio * 100);
          return (
            <li key={option.index}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-kum-800">{option.label}</span>
                <span className="shrink-0 tabular-nums text-kum-500">
                  {option.count} · %{percent}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-kum-200">
                <div
                  className="h-full rounded-full bg-zumrut-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
