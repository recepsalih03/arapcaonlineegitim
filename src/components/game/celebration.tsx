"use client";

const RENKLER = [
  "var(--color-oyun-firuze)",
  "var(--color-oyun-lacivert)",
  "var(--color-oyun-firuze)",
  "var(--color-oyun-altin)",
  "var(--color-oyun-zumrut)",
  "var(--color-oyun-mercan)",
];

/** Deterministik sözde-rastgele: sunucu ve istemci aynı sonucu üretsin. */
function karisik(tohum: number): number {
  const x = Math.sin(tohum * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Oyun bitince patlayan konfeti.
 *
 * Kütüphane yerine 60 küçük parça: canvas ve ek paket gerekmiyor, animasyon
 * tamamen CSS'te. `tetik` her arttığında `key` değişip bileşen yeniden kurulur
 * ve animasyon baştan oynar; durum ve zamanlayıcı tutmaya gerek kalmaz.
 */
export function Konfeti({ tetik }: { tetik: number }) {
  if (tetik === 0) return null;

  return (
    <div
      key={tetik}
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0 overflow-visible"
      aria-hidden
    >
      {Array.from({ length: 60 }, (_, i) => {
        const r1 = karisik(i + 1);
        const r2 = karisik(i + 100);
        const r3 = karisik(i + 200);
        const yuvarlak = i % 3 === 0;
        const boyut = 6 + Math.round(r3 * 8);

        return (
          <span
            key={i}
            className="oyun-konfeti-parca absolute block"
            style={{
              left: `${Math.round(r1 * 100)}%`,
              width: yuvarlak ? boyut : boyut * 0.6,
              height: boyut,
              borderRadius: yuvarlak ? "50%" : "2px",
              backgroundColor: RENKLER[i % RENKLER.length],
              animationDelay: `${Math.round(r2 * 500)}ms`,
              animationDuration: `${1.4 + r3 * 1.2}s`,
              // Parçalar farklı yönlere savrulsun.
              ["--kayma" as string]: `${Math.round((r2 - 0.5) * 260)}px`,
              ["--donus" as string]: `${Math.round(360 + r1 * 900)}deg`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Oyun tamamlanınca çıkan tebrik kutusu. */
export function BasariKutusu({
  baslik,
  altYazi,
}: {
  baslik: string;
  altYazi?: string;
}) {
  return (
    <div className="oyun-yukari relative overflow-hidden rounded-card p-5 text-center text-white shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, var(--color-oyun-zumrut), var(--color-oyun-firuze) 60%, var(--color-oyun-firuze))",
      }}
    >
      <div className="oyun-zemin absolute inset-0 opacity-50" aria-hidden />

      {/* Köşelerde parlayan yıldızlar. */}
      {[
        { top: "12%", left: "8%", gecikme: "0.1s" },
        { top: "22%", right: "12%", gecikme: "0.35s" },
        { bottom: "16%", left: "16%", gecikme: "0.6s" },
        { bottom: "24%", right: "9%", gecikme: "0.2s" },
      ].map((konum, i) => (
        <span
          key={i}
          className="oyun-yildiz absolute text-lg"
          style={{ ...konum, animationDelay: konum.gecikme }}
          aria-hidden
        >
          ✨
        </span>
      ))}

      <div className="relative">
        <span className="oyun-zipla inline-block text-5xl" aria-hidden>
          🎉
        </span>
        <p className="mt-2 text-lg font-bold drop-shadow-sm">{baslik}</p>
        {altYazi ? (
          <p className="mt-0.5 text-sm text-white/85">{altYazi}</p>
        ) : null}
      </div>
    </div>
  );
}
