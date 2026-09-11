"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";

import { BasariKutusu, Konfeti } from "@/components/game/celebration";
import { PuanCubugu } from "@/components/game/score-bar";
import { useIlerleme } from "@/components/game/use-progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { boslukParcala, cevapEsit } from "@/modules/game/content";

/**
 * Boşluk doldurma.
 *
 * Cevaplar kontrol edilene kadar hiçbir şey yeşile/kırmızıya dönmez; öğrenci
 * yazarken sürekli "yanlış" görmesin. Kontrolden sonra düzeltme yapıldığında
 * o boşluğun işareti temizlenir.
 */
export function BoslukOyunu({
  gameId,
  metin,
  arapca,
}: {
  /** null ise ilerleme kaydedilmez (admin önizlemesi). */
  gameId: string | null;
  metin: string;
  arapca: boolean;
}) {
  const ilerlemeBildir = useIlerleme(gameId);
  const parcalar = useMemo(() => boslukParcala(metin), [metin]);
  const bosluklar = useMemo(
    () => parcalar.filter((p) => p.tur === "bosluk"),
    [parcalar],
  );

  const [cevaplar, setCevaplar] = useState<Record<number, string>>({});
  const [kontrol, setKontrol] = useState<Record<number, boolean>>({});
  const [tur, setTur] = useState(0);

  const dogruSayisi = Object.values(kontrol).filter(Boolean).length;
  const bitti = bosluklar.length > 0 && dogruSayisi === bosluklar.length;

  function kontrolEt() {
    const yeni: Record<number, boolean> = {};
    for (const b of bosluklar) {
      if (b.tur !== "bosluk") continue;
      yeni[b.sira] = cevapEsit(cevaplar[b.sira] ?? "", b.cevap);
    }
    setKontrol(yeni);

    const dogru = Object.values(yeni).filter(Boolean).length;
    ilerlemeBildir(dogru, bosluklar.length);

    if (dogru === bosluklar.length && bosluklar.length > 0) {
      setTur((t) => t + 1);
    }
  }

  function sifirla() {
    setCevaplar({});
    setKontrol({});
  }

  return (
    <div className="relative space-y-5">
      <Konfeti tetik={tur} />
      <PuanCubugu
        dogru={dogruSayisi}
        toplam={bosluklar.length}
        bitti={bitti}
        onSifirla={sifirla}
      />

      {/* Metin alanı renkli bir çerçeve içinde: oyun alanı belge gibi durmasın. */}
      <div
        className="rounded-card p-[3px] shadow-md"
        style={{
          background:
            "linear-gradient(135deg, var(--color-oyun-zumrut), var(--color-oyun-fistik))",
        }}
      >
        <div
          dir={arapca ? "rtl" : "ltr"}
          className={cn(
            "rounded-[calc(var(--radius-card)-3px)] bg-white p-4 leading-[2.8] sm:p-6",
            arapca ? "text-right text-xl" : "text-[17px]",
          )}
        >
        {parcalar.map((parca, i) =>
          parca.tur === "metin" ? (
            <span key={i} className="whitespace-pre-wrap">
              {parca.deger}
            </span>
          ) : (
            <BoslukAlani
              key={i}
              deger={cevaplar[parca.sira] ?? ""}
              durum={kontrol[parca.sira]}
              arapca={arapca}
              onDegis={(v) => {
                setCevaplar((o) => ({ ...o, [parca.sira]: v }));
                // Düzeltme yapılınca eski işaret kalmasın.
                setKontrol((o) => {
                  if (!(parca.sira in o)) return o;
                  const kalan = { ...o };
                  delete kalan[parca.sira];
                  return kalan;
                });
              }}
            />
          ),
        )}
        </div>
      </div>

      {bitti ? (
        <BasariKutusu
          baslik="Hepsi doğru!"
          altYazi={`${bosluklar.length} boşluğun tamamını bildin.`}
        />
      ) : (
        <Button type="button" onClick={kontrolEt} size="lg" variant="oyun" block>
          Kontrol et
        </Button>
      )}
    </div>
  );
}

function BoslukAlani({
  deger,
  durum,
  arapca,
  onDegis,
}: {
  deger: string;
  durum: boolean | undefined;
  arapca: boolean;
  onDegis: (v: string) => void;
}) {
  return (
    <span className="relative mx-1 inline-flex items-center align-middle">
      <input
        value={deger}
        onChange={(o) => onDegis(o.target.value)}
        dir={arapca ? "rtl" : "ltr"}
        // 16px altı yazı iOS'ta odaklanınca sayfayı yakınlaştırıyor.
        className={cn(
          "w-[8rem] rounded-xl border-2 px-2 py-1.5 text-center text-[16px] font-semibold shadow-sm transition-all focus:outline-none",
          durum === true &&
            "oyun-pop border-oyun-dogru bg-oyun-dogru/20 text-zumrut-900",
          durum === false && "oyun-sarsil border-oyun-yanlis bg-oyun-yanlis/15",
          durum === undefined &&
            "border-oyun-firuze/35 bg-oyun-firuze/5 text-kum-900 focus:oyun-nabiz focus:border-oyun-firuze focus:bg-white",
        )}
        style={
          durum === undefined
            ? ({ ["--nabiz-renk" as string]: "var(--color-oyun-firuze)" })
            : undefined
        }
        aria-label="Boşluk"
      />
      {durum === true ? (
        <Check className="oyun-pop pointer-events-none absolute -right-1.5 -top-2 size-5 rounded-full bg-oyun-dogru p-0.5 text-white shadow" aria-hidden />
      ) : null}
      {durum === false ? (
        <X className="pointer-events-none absolute -right-1.5 -top-2 size-5 rounded-full bg-oyun-yanlis p-0.5 text-white shadow" aria-hidden />
      ) : null}
    </span>
  );
}
