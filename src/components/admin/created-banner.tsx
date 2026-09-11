import { CheckCircle2 } from "lucide-react";

/**
 * Yeni kayıt eklendikten sonra liste sayfasında gösterilen onay şeridi.
 * Form sayfasında "eklendi" yazıp öylece kalmak yerine kullanıcı listeye
 * getiriliyor ve eklediği şeyin adı burada teyit ediliyor.
 */
export function EklendiBandi({
  ad,
  tur,
}: {
  ad: string;
  /** "Video" | "Oyun" gibi. */
  tur: string;
}) {
  return (
    <div className="oyun-yukari flex items-start gap-3 rounded-card border border-zumrut-300 bg-zumrut-50 px-4 py-3.5">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-zumrut-600" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold text-zumrut-900">{tur} eklendi</p>
        <p className="mt-0.5 truncate text-sm text-zumrut-800/80">
          &ldquo;{ad}&rdquo; kaydedildi ve listede görünüyor.
        </p>
      </div>
    </div>
  );
}
