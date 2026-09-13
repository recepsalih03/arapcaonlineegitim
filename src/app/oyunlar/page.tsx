import { Gamepad2 } from "lucide-react";
import type { Metadata } from "next";

import { OyunKarti } from "@/components/game/game-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/empty-state";
import { sinifRozeti } from "@/lib/constants";
import { listActiveGames } from "@/modules/game/service";

export const metadata: Metadata = { title: "Oyunlar" };

/**
 * Girişsiz oyun listesi. Şu an tüm aktif oyunlar herkese açık; ziyaretçi
 * giriş yapmadan görüntüleyip oynayabilir. İlerleme kaydedilmez (kullanıcı yok).
 */
export default async function PublicOyunlarPage() {
  const games = await listActiveGames().catch(() => []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zumrut-900 sm:text-3xl">
          Oyunlar
        </h1>
        <p className="mt-1 text-[15px] text-kum-600">
          Arapça alıştırmalarını oyunlarla pekiştir. Giriş yapmana gerek yok.
        </p>

        {games.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Henüz oyun yok."
              description="Yakında burada alıştırma oyunları olacak."
              action={
                <span className="grid size-12 place-items-center rounded-xl bg-zumrut-50 text-zumrut-700">
                  <Gamepad2 className="size-6" aria-hidden />
                </span>
              }
            />
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game, i) => (
              <li key={game.id}>
                <OyunKarti
                  href={`/oyunlar/${game.id}`}
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
      </main>
      <SiteFooter />
    </>
  );
}
