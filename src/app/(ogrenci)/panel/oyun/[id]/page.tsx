import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OyunAlani } from "@/components/game/game-area";
import { OyunBasligi } from "@/components/game/game-header";
import { Alert } from "@/components/ui/alert";
import { OYUNLAR_OGRENCIYE_ACIK, sinifRozeti } from "@/lib/constants";
import { requireStudent } from "@/modules/auth/session";
import { icerikCoz } from "@/modules/game/content";
import { getActiveGame } from "@/modules/game/service";

export async function generateMetadata({
  params,
}: PageProps<"/panel/oyun/[id]">): Promise<Metadata> {
  const { id } = await params;
  await requireStudent();
  const game = await getActiveGame(id).catch(() => null);
  return { title: game?.title ?? "Oyun" };
}

export default async function OyunOynaPage({
  params,
}: PageProps<"/panel/oyun/[id]">) {
  if (!OYUNLAR_OGRENCIYE_ACIK) notFound();

  await requireStudent();
  const { id } = await params;

  // Tüm oyunlar herkese açık: öğrenci başka sınıfın oyununu da oynayabilir.
  const game = await getActiveGame(id);
  if (!game) notFound();

  const icerik = icerikCoz(game.type, game.content);

  return (
    <div className="space-y-5">
      <Link
        href="/panel/oyun"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Oyunlar
      </Link>

      <OyunBasligi
        type={game.type}
        baslik={game.title}
        altYazi={game.description}
        rozet={sinifRozeti(game.grades.map((g) => g.gradeLevel))}
      />

      {icerik === null ? (
        <Alert tone="error">
          Bu oyun şu anda açılamıyor. Öğretmenine haber verebilirsin.
        </Alert>
      ) : (
        <OyunAlani
          gameId={game.id}
          type={game.type}
          icerik={icerik}
          arapca={game.isArabic}
        />
      )}
    </div>
  );
}
