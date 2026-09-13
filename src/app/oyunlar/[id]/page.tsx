import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OyunAlani } from "@/components/game/game-area";
import { OyunBasligi } from "@/components/game/game-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { sinifRozeti } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";
import { icerikCoz } from "@/modules/game/content";
import { getActiveGame } from "@/modules/game/service";

export async function generateMetadata({
  params,
}: PageProps<"/oyunlar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const game = await getActiveGame(id).catch(() => null);
  return { title: game?.title ?? "Oyun" };
}

/**
 * Girişsiz oyun oynama. gameId={null} verildiği için ilerleme kaydedilmez
 * (kullanıcı yok) — admin önizlemesiyle aynı mantık.
 */
export default async function PublicOyunOynaPage({
  params,
}: PageProps<"/oyunlar/[id]">) {
  const { id } = await params;

  const game = await getActiveGame(id);
  if (!game) notFound();

  const icerik = icerikCoz(game.type, game.content);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
        <Link
          href="/oyunlar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Oyunlar
        </Link>

        <div className="mt-4">
          <OyunBasligi
            type={game.type}
            baslik={game.title}
            altYazi={game.description}
            rozet={sinifRozeti(game.grades.map((g) => g.gradeLevel))}
          />
        </div>

        <div className="mt-5">
          {icerik === null ? (
            <Alert tone="error">Bu oyun şu anda açılamıyor.</Alert>
          ) : (
            <OyunAlani
              gameId={null}
              type={game.type}
              icerik={icerik}
              arapca={game.isArabic}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
