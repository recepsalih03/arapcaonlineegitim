import { BulmacaOyunu } from "@/components/game/crossword";
import { BoslukOyunu } from "@/components/game/fill-blanks";
import { KartOyunu } from "@/components/game/flashcards";
import { EslestirmeOyunu } from "@/components/game/matching";
import type { OyunIcerik } from "@/modules/game/content";
import type { OyunTuru } from "@/modules/game/types";

/**
 * Türüne göre doğru oynatıcıyı seçer.
 * Hem öğrenci sayfası hem admin önizlemesi bunu kullanır; iki yerde ayrı
 * dallanma yazılsaydı biri güncellenip diğeri unutulurdu.
 */
export function OyunAlani({
  gameId,
  type,
  icerik,
  arapca,
}: {
  /** null = ilerleme kaydedilmez (admin önizlemesi). */
  gameId: string | null;
  type: OyunTuru;
  icerik: OyunIcerik;
  arapca: boolean;
}) {
  if (type === "BOSLUK") {
    if (!("metin" in icerik)) return null;
    return <BoslukOyunu gameId={gameId} metin={icerik.metin} arapca={arapca} />;
  }

  if (!("ciftler" in icerik)) return null;

  switch (type) {
    case "KART":
      return <KartOyunu gameId={gameId} ciftler={icerik.ciftler} arapca={arapca} />;
    case "ESLESTIRME":
      return (
        <EslestirmeOyunu gameId={gameId} ciftler={icerik.ciftler} arapca={arapca} />
      );
    case "BULMACA":
      return (
        <BulmacaOyunu gameId={gameId} ciftler={icerik.ciftler} arapca={arapca} />
      );
  }
}
