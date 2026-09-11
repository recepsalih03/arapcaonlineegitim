import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GameForm } from "@/components/admin/game-form";
import { Card, CardContent } from "@/components/ui/card";
import { OYUN_TURLERI, OYUN_TURU_LISTESI, type OyunTuru } from "@/modules/game/types";

export const metadata: Metadata = { title: "Yeni Oyun" };

/**
 * Önce tür seçilir (?tur=...), sonra o türün editörü açılır.
 * Tür sonradan değiştirilemediği için baştan net seçilmesi önemli.
 */
export default async function YeniOyunPage({
  searchParams,
}: PageProps<"/yonetim/oyunlar/yeni">) {
  const params = await searchParams;
  const secilen = String(params?.tur ?? "");
  const tur = OYUN_TURU_LISTESI.includes(secilen as OyunTuru)
    ? (secilen as OyunTuru)
    : null;

  return (
    <div className="space-y-5">
      <Link
        href="/yonetim/oyunlar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Oyunlar
      </Link>

      {tur === null ? (
        <>
          <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
            Ne tür bir oyun hazırlayacaksınız?
          </h1>

          <div className="grid gap-3 sm:grid-cols-2">
            {OYUN_TURU_LISTESI.map((t) => {
              const bilgi = OYUN_TURLERI[t];
              return (
                <Link
                  key={t}
                  href={`/yonetim/oyunlar/yeni?tur=${t}`}
                  className="group overflow-hidden rounded-card border border-kum-200 bg-white transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
                >
                  <div className="h-1.5 w-full" style={{ background: bilgi.renk }} />
                  <div className="p-4 sm:p-5">
                    <span className="text-2xl" aria-hidden>
                      {bilgi.simge}
                    </span>
                    <p className="mt-2 font-semibold text-kum-900">{bilgi.ad}</p>
                    <p className="mt-1 text-sm text-kum-500">{bilgi.aciklama}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
            <span aria-hidden>{OYUN_TURLERI[tur].simge}</span>
            Yeni {OYUN_TURLERI[tur].ad.toLocaleLowerCase("tr")} oyunu
          </h1>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <GameForm type={tur} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
