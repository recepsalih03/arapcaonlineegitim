import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { EklendiBandi } from "@/components/admin/created-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { deleteGameAction } from "@/modules/game/actions";
import { oyunOzetleri } from "@/modules/game/progress";
import { listAllGames } from "@/modules/game/service";
import { OYUN_TURLERI } from "@/modules/game/types";

export const metadata: Metadata = { title: "Oyunlar" };

export default async function YonetimOyunlarPage({
  searchParams,
}: PageProps<"/yonetim/oyunlar">) {
  const eklendi = String((await searchParams)?.eklendi ?? "");
  const games = await listAllGames();
  const ozet = await oyunOzetleri(games.map((g) => g.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
            Oyunlar
          </h1>
          <p className="mt-1 text-sm text-kum-500">{games.length} oyun</p>
        </div>
        <Button asChild>
          <Link href="/yonetim/oyunlar/yeni">
            <Plus className="size-4" aria-hidden />
            Yeni oyun
          </Link>
        </Button>
      </div>

      {eklendi ? <EklendiBandi tur="Oyun" ad={eklendi} /> : null}

      {games.length === 0 ? (
        <EmptyState
          title="Henüz oyun yok."
          description="Boşluk doldurma, kart, eşleştirme veya bulmaca hazırlayabilirsiniz."
          action={
            <Button asChild>
              <Link href="/yonetim/oyunlar/yeni">Yeni oyun</Link>
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Oyun</Th>
                <Th>Tür</Th>
                <Th>Sınıflar</Th>
                <Th>Durum</Th>
                <Th className="text-right">Oynayan</Th>
                <Th className="text-right">İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <Tr key={game.id}>
                  <Td className="font-medium text-kum-900">
                    <Link
                      href={`/yonetim/oyunlar/${game.id}`}
                      className="hover:text-zumrut-700"
                    >
                      {game.title}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-kum-600">
                    {OYUN_TURLERI[game.type].simge} {OYUN_TURLERI[game.type].ad}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {game.grades.map(({ gradeLevel }) => (
                        <Badge key={gradeLevel} tone="yesil">
                          {gradeLevel}
                        </Badge>
                      ))}
                    </span>
                  </Td>
                  <Td>
                    {game.isActive ? (
                      <Badge tone="yesil">Yayında</Badge>
                    ) : (
                      <Badge tone="kirmizi">Kapalı</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-right tabular-nums text-kum-600">
                    {ozet.get(game.id)?.bitiren ?? 0} / {ozet.get(game.id)?.oynayan ?? 0}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/yonetim/oyunlar/${game.id}`}>
                          <Pencil className="size-4" aria-hidden />
                          Düzenle
                        </Link>
                      </Button>
                      <ConfirmForm
                        action={deleteGameAction}
                        fields={{ gameId: game.id }}
                        confirmMessage={`"${game.title}" oyunu silinsin mi?`}
                        showFeedback={false}
                      >
                        Sil
                      </ConfirmForm>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
