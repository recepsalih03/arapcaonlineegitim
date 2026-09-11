import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OyunAlani } from "@/components/game/game-area";
import { OyunBasligi } from "@/components/game/game-header";
import { Alert } from "@/components/ui/alert";
import { requireAdmin } from "@/modules/auth/session";
import { icerikCoz } from "@/modules/game/content";
import { getGame } from "@/modules/game/service";

export const metadata: Metadata = { title: "Oyun Önizleme" };

/**
 * Adminin hazırladığı oyunu öğrencinin göreceği hâliyle denemesi.
 * İlerleme kaydedilmez (gameId null geçilir).
 */
export default async function OyunOnizlemePage({
  params,
}: PageProps<"/yonetim/oyunlar/[id]/onizle">) {
  await requireAdmin();
  const { id } = await params;

  const game = await getGame(id);
  if (!game) notFound();

  const icerik = icerikCoz(game.type, game.content);

  return (
    <div className="space-y-5">
      <Link
        href={`/yonetim/oyunlar/${game.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Düzenlemeye dön
      </Link>

      <OyunBasligi
        type={game.type}
        baslik={game.title}
        altYazi="Önizleme — burada oynadıklarınız kaydedilmez."
      />

      {icerik === null ? (
        <Alert tone="error">Bu oyunun içeriği okunamıyor.</Alert>
      ) : (
        <OyunAlani
          gameId={null}
          type={game.type}
          icerik={icerik}
          arapca={game.isArabic}
        />
      )}
    </div>
  );
}
