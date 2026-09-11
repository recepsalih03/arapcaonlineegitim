"use client";

import { useMemo, useRef, useState } from "react";

import { BasariKutusu, Konfeti } from "@/components/game/celebration";
import { PuanCubugu } from "@/components/game/score-bar";
import { useIlerleme } from "@/components/game/use-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bulmacaUret, type YerlesikKelime } from "@/modules/game/crossword";

/**
 * Her kelimeye kendi rengi verilir.
 *
 * Tek renkli (mavi) ızgara hem tekdüzeydi hem de hangi hücrenin hangi ipucuna
 * ait olduğu görünmüyordu. Renkler bilgi taşısın diye: hücre dolgusu o
 * kelimenin renginin çok açık tonu (%14), kenarlık biraz koyusu. Doygun renk
 * kullanılmıyor — uzun süre bakılan bir ızgarada gözü yorardı.
 */
const KELIME_RENKLERI = [
  "var(--color-oyun-firuze)",
  "var(--color-oyun-altin)",
  "var(--color-oyun-mercan)",
  "var(--color-oyun-lacivert)",
  "var(--color-oyun-fistik)",
  "var(--color-oyun-zumrut)",
];

/**
 * Bulmaca. Izgara yerleşimi istemcide üretilir (bkz. modules/game/crossword.ts).
 *
 * Arapça'da yatay kelimeler sağdan sola okunur. Yerleşim algoritmasını iki
 * yönlü yapmak yerine ızgarayı `dir="rtl"` ile çeviriyoruz: sütunlar ters
 * sırada boyanıyor, kelime yine soldan sağa dizilmiş kalıyor ama ekranda
 * doğru yönde okunuyor.
 */
export function BulmacaOyunu({
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
  const yerlesim = useMemo(() => bulmacaUret(ciftler), [ciftler]);
  const [harfler, setHarfler] = useState<Record<string, string>>({});
  const [kontrol, setKontrol] = useState(false);
  const [tur, setTur] = useState(0);
  const hucreler = useRef(new Map<string, HTMLInputElement | null>());

  const { satirSayisi, sutunSayisi, kelimeler } = yerlesim;

  /** "satır,sütun" → o hücrede olması gereken harf. */
  const beklenen = useMemo(() => {
    const harita = new Map<string, string>();
    for (const k of kelimeler) {
      k.kelime.split("").forEach((h, i) => {
        const r = k.yatay ? k.satir : k.satir + i;
        const c = k.yatay ? k.sutun + i : k.sutun;
        harita.set(`${r},${c}`, h);
      });
    }
    return harita;
  }, [kelimeler]);

  /** Kelime sırasına göre renk; ipucu listesiyle ızgara aynı rengi paylaşsın. */
  const kelimeRengi = useMemo(() => {
    const harita = new Map<string, string>();
    kelimeler.forEach((k, i) => {
      harita.set(
        `${k.satir},${k.sutun},${k.yatay}`,
        KELIME_RENKLERI[i % KELIME_RENKLERI.length],
      );
    });
    return harita;
  }, [kelimeler]);

  /**
   * "satır,sütun" → o hücreye düşen renkler. Kesişen hücrede iki kelime
   * buluşur; orayı beyaz bırakıp kenarlığını koyultuyoruz ki kesişim noktası
   * gözle ayırt edilebilsin.
   */
  const hucreRenkleri = useMemo(() => {
    const harita = new Map<string, string[]>();
    for (const k of kelimeler) {
      const renk = kelimeRengi.get(`${k.satir},${k.sutun},${k.yatay}`)!;
      k.kelime.split("").forEach((_, i) => {
        const r = k.yatay ? k.satir : k.satir + i;
        const c = k.yatay ? k.sutun + i : k.sutun;
        const anahtar = `${r},${c}`;
        harita.set(anahtar, [...(harita.get(anahtar) ?? []), renk]);
      });
    }
    return harita;
  }, [kelimeler, kelimeRengi]);

  /** Hücre başlangıcındaki kelime numaraları. */
  const numaralar = useMemo(() => {
    const harita = new Map<string, number>();
    for (const k of kelimeler) harita.set(`${k.satir},${k.sutun}`, k.numara);
    return harita;
  }, [kelimeler]);

  const dogruKelime = (k: YerlesikKelime) =>
    k.kelime.split("").every((h, i) => {
      const r = k.yatay ? k.satir : k.satir + i;
      const c = k.yatay ? k.sutun + i : k.sutun;
      return (harfler[`${r},${c}`] ?? "").toLocaleUpperCase("tr") === h;
    });

  const dogruSayisi = kelimeler.filter(dogruKelime).length;
  const bitti = kelimeler.length > 0 && dogruSayisi === kelimeler.length;

  function yaz(r: number, c: number, deger: string) {
    const harf = deger.slice(-1).toLocaleUpperCase("tr");
    setHarfler((o) => ({ ...o, [`${r},${c}`]: harf }));
    setKontrol(false);
    // Harf girilince bir sonraki hücreye geç: önce yana, olmazsa aşağı.
    if (harf && !odakla(r, c + 1)) odakla(r + 1, c);
  }

  function odakla(r: number, c: number): boolean {
    const alan = hucreler.current.get(`${r},${c}`);
    if (!alan) return false;
    alan.focus();
    alan.select();
    return true;
  }

  function kontrolEt() {
    setKontrol(true);
    ilerlemeBildir(dogruSayisi, kelimeler.length);
    if (dogruSayisi === kelimeler.length) setTur((t) => t + 1);
  }

  if (kelimeler.length === 0) {
    return (
      <p className="rounded-card border border-kum-200 bg-white p-6 text-center text-kum-500">
        Bu bulmaca için yeterli kelime yok.
      </p>
    );
  }

  return (
    <div className="relative space-y-5">
      <Konfeti tetik={tur} />
      <PuanCubugu
        dogru={dogruSayisi}
        toplam={kelimeler.length}
        bitti={bitti}
        onSifirla={() => {
          setHarfler({});
          setKontrol(false);
        }}
      />

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          dir={arapca ? "rtl" : "ltr"}
          className="mx-auto grid w-max gap-[3px] rounded-card border border-kum-200 bg-kum-100 p-2 shadow-sm"
          style={{ gridTemplateColumns: `repeat(${sutunSayisi}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: satirSayisi * sutunSayisi }, (_, i) => {
            const r = Math.floor(i / sutunSayisi);
            const c = i % sutunSayisi;
            const key = `${r},${c}`;
            const gerekli = beklenen.get(key);

            if (!gerekli) {
              return <span key={key} className="size-9 sm:size-10" />;
            }

            const deger = harfler[key] ?? "";
            const dogru = kontrol && deger.toLocaleUpperCase("tr") === gerekli;
            const yanlis = kontrol && deger !== "" && !dogru;

            const renkler = hucreRenkleri.get(key) ?? [];
            const kesisim = renkler.length > 1;
            const renk = renkler[0];
            // Kesişim hücresi beyaz kalır, kenarlığı koyulur: iki kelimenin
            // buluştuğu yer bakışta belli olsun.
            const sade = !dogru && !yanlis;

            return (
              <span key={key} className="relative">
                {numaralar.has(key) ? (
                  <span
                    className="pointer-events-none absolute start-0.5 top-0 z-10 text-[9px] font-bold"
                    style={{ color: renk }}
                  >
                    {numaralar.get(key)}
                  </span>
                ) : null}
                <input
                  ref={(el) => {
                    hucreler.current.set(key, el);
                  }}
                  value={deger}
                  onChange={(o) => yaz(r, c, o.target.value)}
                  onKeyDown={(o) => {
                    if (o.key === "Backspace" && !deger && !odakla(r, c - 1)) {
                      odakla(r - 1, c);
                    }
                  }}
                  maxLength={1}
                  inputMode="text"
                  aria-label={`${r + 1}. satır ${c + 1}. sütun`}
                  className={cn(
                    "size-9 rounded-md border-2 text-center text-base font-bold uppercase shadow-sm transition-all focus:outline-none focus:scale-110 sm:size-10",
                    dogru && "oyun-pop border-oyun-dogru bg-oyun-dogru/25 text-zumrut-900",
                    yanlis && "oyun-sarsil border-oyun-yanlis bg-oyun-yanlis/15",
                    sade && "text-kum-900",
                  )}
                  style={
                    sade
                      ? {
                          backgroundColor: kesisim
                            ? "#fff"
                            : `color-mix(in srgb, ${renk} 14%, white)`,
                          borderColor: `color-mix(in srgb, ${renk} ${kesisim ? 55 : 32}%, white)`,
                        }
                      : undefined
                  }
                />
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Ipuclari
          baslik="Soldan sağa"
          kelimeler={kelimeler.filter((k) => k.yatay)}
          arapca={arapca}
          dogruMu={dogruKelime}
          renkAl={(k) => kelimeRengi.get(`${k.satir},${k.sutun},${k.yatay}`)!}
        />
        <Ipuclari
          baslik="Yukarıdan aşağı"
          kelimeler={kelimeler.filter((k) => !k.yatay)}
          arapca={arapca}
          dogruMu={dogruKelime}
          renkAl={(k) => kelimeRengi.get(`${k.satir},${k.sutun},${k.yatay}`)!}
        />
      </div>

      {bitti ? (
        <BasariKutusu
          baslik="Bulmacayı bitirdin!"
          altYazi={`${kelimeler.length} kelimenin tamamı doğru.`}
        />
      ) : (
        <Button type="button" size="lg" variant="oyun" block onClick={kontrolEt}>
          Kontrol et
        </Button>
      )}
    </div>
  );
}

function Ipuclari({
  baslik,
  kelimeler,
  arapca,
  dogruMu,
  renkAl,
}: {
  baslik: string;
  kelimeler: YerlesikKelime[];
  arapca: boolean;
  dogruMu: (k: YerlesikKelime) => boolean;
  renkAl: (k: YerlesikKelime) => string;
}) {
  if (kelimeler.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-kum-500">
        {baslik}
      </h3>
      <ol className="space-y-1.5">
        {kelimeler.map((k) => (
          <li
            key={`${k.satir},${k.sutun},${k.yatay}`}
            className={cn(
              "flex gap-2 text-sm transition-colors",
              dogruMu(k) ? "text-oyun-dogru line-through" : "text-kum-700",
            )}
          >
            <span
              className="grid size-5 shrink-0 place-items-center rounded-md text-[11px] font-bold tabular-nums text-white"
              style={{ backgroundColor: renkAl(k) }}
              aria-hidden
            >
              {k.numara}
            </span>
            <span dir={arapca ? "rtl" : "ltr"} className="min-w-0 flex-1">
              {k.ipucu}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
