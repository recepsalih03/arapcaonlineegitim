import { Gamepad2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OyunKarti } from "@/components/game/game-card";
import { EmptyState } from "@/components/ui/empty-state";
import { OYUNLAR_OGRENCIYE_ACIK, sinifRozeti } from "@/lib/constants";
import { requireStudent } from "@/modules/auth/session";
import { listActiveGames } from "@/modules/game/service";

export const metadata: Metadata = { title: "Oyunlar" };

export default async function OgrenciOyunlarPage() {
  // Modül yayına alınana kadar öğrenciye kapalı (bkz. OYUNLAR_OGRENCIYE_ACIK).
  if (!OYUNLAR_OGRENCIYE_ACIK) notFound();

  // Tüm sınıfların oyunları herkese açık; öğrenci de her oyunu oynayabilir,
  // hangi sınıfa ait olduğunu kartındaki rozetten görür.
  await requireStudent();
  const games = await listActiveGames();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Oyunlar
        </h1>
        <p className="mt-1 text-sm text-kum-500">
          Öğrendiklerini alıştırmalarla pekiştir.
        </p>
      </div>

      {games.length === 0 ? (
        <EmptyState
          title="Henüz oyun yok."
          description="Öğretmenin yeni bir alıştırma eklediğinde burada göreceksin."
          action={
            <span className="grid size-12 place-items-center rounded-xl bg-zumrut-50 text-zumrut-700">
              <Gamepad2 className="size-6" aria-hidden />
            </span>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {games.map((game, i) => (
            <li key={game.id}>
              <OyunKarti
                href={`/panel/oyun/${game.id}`}
                type={game.type}
                baslik={game.title}
                altYazi={game.description}
                rozet={sinifRozeti(game.grades.map((g) => g.gradeLevel))}
                gecikmeMs={i * 70}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
