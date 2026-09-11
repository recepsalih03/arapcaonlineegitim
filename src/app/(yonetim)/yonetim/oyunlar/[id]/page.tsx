import { ArrowLeft, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameForm, type OyunFormVerisi } from "@/components/admin/game-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { gradeLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { oyunIlerlemesi } from "@/modules/game/progress";
import { icerikCoz } from "@/modules/game/content";
import { bulmacaUret } from "@/modules/game/crossword";
import { getGame } from "@/modules/game/service";
import { OYUN_TURLERI } from "@/modules/game/types";

export const metadata: Metadata = { title: "Oyun Düzenle" };

export default async function OyunDuzenlePage({
  params,
}: PageProps<"/yonetim/oyunlar/[id]">) {
  const { id } = await params;
  const [game, ilerleme] = await Promise.all([getGame(id), oyunIlerlemesi(id)]);
  if (!game) notFound();

  const icerik = icerikCoz(game.type, game.content);
  const ciftler = icerik && "ciftler" in icerik ? icerik.ciftler : undefined;

  const veri: OyunFormVerisi = {
    id: game.id,
    title: game.title,
    description: game.description,
    type: game.type,
    isArabic: game.isArabic,
    isActive: game.isActive,
    grades: game.grades.map((g) => g.gradeLevel),
    metin: icerik && "metin" in icerik ? icerik.metin : undefined,
    ciftler,
  };

  // Bulmacada yerleşemeyen kelimeleri burada söylemek, öğrenci oyunu açtığında
  // eksik görmesinden iyi.
  const disariKalanlar =
    game.type === "BULMACA" && ciftler ? bulmacaUret(ciftler).disariKalanlar : [];

  return (
    <div className="space-y-5">
      <Link
        href="/yonetim/oyunlar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Oyunlar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          <span aria-hidden>{OYUN_TURLERI[game.type].simge}</span>
          {game.title}
        </h1>
        <Button asChild variant="secondary">
          <Link href={`/yonetim/oyunlar/${game.id}/onizle`}>
            <Play className="size-4" aria-hidden />
            Önizle
          </Link>
        </Button>
      </div>

      {icerik === null ? (
        <Alert tone="error">
          Bu oyunun içeriği okunamıyor. Aşağıdan yeniden doldurup kaydedin.
        </Alert>
      ) : null}

      {disariKalanlar.length > 0 ? (
        <Alert tone="warning">
          Şu kelimeler diğerleriyle ortak harf bulunamadığı için bulmacaya
          girmiyor: <strong>{disariKalanlar.join(", ")}</strong>. Ortak harfi olan
          kelimeler ekleyerek yerleşmelerini sağlayabilirsiniz.
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <GameForm type={game.type} game={veri} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Öğrenci ilerlemesi</CardTitle>
        </CardHeader>
        <CardContent>
          {ilerleme.length === 0 ? (
            <EmptyState title="Bu oyunu henüz kimse oynamadı." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Öğrenci</Th>
                    <Th>Sınıf</Th>
                    <Th className="text-right">En iyi</Th>
                    <Th className="text-right">Deneme</Th>
                    <Th>Durum</Th>
                    <Th>Son oynama</Th>
                  </tr>
                </thead>
                <tbody>
                  {ilerleme.map((satir) => (
                    <Tr key={satir.userId}>
                      <Td className="font-medium text-kum-900">
                        <Link
                          href={`/yonetim/ogrenciler/${satir.userId}`}
                          className="hover:text-zumrut-700"
                        >
                          {satir.ad}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-kum-600">
                        {satir.gradeLevel ? gradeLabel(satir.gradeLevel) : "—"}
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums text-kum-700">
                        {satir.dogru} / {satir.toplam}
                      </Td>
                      <Td className="text-right tabular-nums text-kum-600">
                        {satir.denemeSayisi}
                      </Td>
                      <Td>
                        {satir.tamamlandi ? (
                          <Badge tone="yesil">Tamamladı</Badge>
                        ) : (
                          <Badge tone="altin">Devam ediyor</Badge>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-xs text-kum-400">
                        {formatDateTime(satir.sonOynama)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
