import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import type { OgrenciOyunSatiri } from "@/modules/game/progress";
import { OYUN_TURLERI } from "@/modules/game/types";
import type { OgrenciVideoSatiri } from "@/modules/video/progress";

/** İlerleme çubuğu — video ve oyun tablolarında ortak. */
function Cubuk({ yuzde, tamam }: { yuzde: number; tamam: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-kum-200 sm:w-20">
        <span
          className={cn(
            "block h-full rounded-full",
            tamam ? "bg-zumrut-600" : yuzde > 0 ? "bg-altin-400" : "bg-transparent",
          )}
          style={{ width: `${yuzde}%` }}
        />
      </span>
      <span className="shrink-0 tabular-nums text-xs text-kum-500">%{yuzde}</span>
    </span>
  );
}

/**
 * Öğrencinin kendi sınıfındaki videolarda nereye kadar geldiği.
 * Hiç açmadığı videolar da listede: öğretmenin asıl sorusu genelde
 * "neyi izlemedi".
 */
export function OgrenciVideoIlerlemesi({
  satirlar,
}: {
  satirlar: OgrenciVideoSatiri[];
}) {
  if (satirlar.length === 0) {
    return <EmptyState title="Bu sınıfta henüz video yok." />;
  }

  const izlenen = satirlar.filter((s) => s.tamamlandi).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-kum-500">
        <strong className="text-kum-900">
          {izlenen} / {satirlar.length}
        </strong>{" "}
        video izlendi
      </p>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Video</Th>
              <Th>Klasör</Th>
              <Th>İlerleme</Th>
              <Th className="text-right">Kaldığı yer</Th>
              <Th>Son izleme</Th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((satir) => (
              <Tr key={satir.videoId}>
                <Td className="font-medium text-kum-900">
                  <Link
                    href={`/yonetim/videolar/${satir.videoId}`}
                    className="hover:text-zumrut-700"
                  >
                    {satir.baslik}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-kum-500">
                  {satir.klasor ?? "—"}
                </Td>
                <Td>
                  {satir.tamamlandi ? (
                    <Badge tone="yesil">İzledi</Badge>
                  ) : satir.yuzde > 0 ? (
                    <Cubuk yuzde={satir.yuzde} tamam={false} />
                  ) : (
                    <span className="text-xs text-kum-400">Açmadı</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums text-kum-600">
                  {satir.positionSec > 0 ? formatDuration(satir.positionSec) : "—"}
                </Td>
                <Td className="whitespace-nowrap text-xs text-kum-400">
                  {satir.sonIzleme ? formatDate(satir.sonIzleme) : "—"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}

/** Öğrencinin kendi sınıfındaki oyunlardaki durumu. */
export function OgrenciOyunIlerlemesi({
  satirlar,
}: {
  satirlar: OgrenciOyunSatiri[];
}) {
  if (satirlar.length === 0) {
    return <EmptyState title="Bu sınıfta henüz oyun yok." />;
  }

  const bitiren = satirlar.filter((s) => s.tamamlandi).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-kum-500">
        <strong className="text-kum-900">
          {bitiren} / {satirlar.length}
        </strong>{" "}
        oyun tamamlandı
      </p>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Oyun</Th>
              <Th>Tür</Th>
              <Th className="text-right">En iyi</Th>
              <Th className="text-right">Deneme</Th>
              <Th>Durum</Th>
              <Th>Son oynama</Th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((satir) => (
              <Tr key={satir.gameId}>
                <Td className="font-medium text-kum-900">
                  <Link
                    href={`/yonetim/oyunlar/${satir.gameId}`}
                    className="hover:text-zumrut-700"
                  >
                    {satir.baslik}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-kum-600">
                  {OYUN_TURLERI[satir.tur].simge} {OYUN_TURLERI[satir.tur].ad}
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums text-kum-700">
                  {satir.toplam > 0 ? `${satir.dogru} / ${satir.toplam}` : "—"}
                </Td>
                <Td className="text-right tabular-nums text-kum-600">
                  {satir.denemeSayisi || "—"}
                </Td>
                <Td>
                  {satir.tamamlandi ? (
                    <Badge tone="yesil">Tamamladı</Badge>
                  ) : satir.denemeSayisi > 0 ? (
                    <Badge tone="altin">Devam ediyor</Badge>
                  ) : (
                    <span className="text-xs text-kum-400">Oynamadı</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-xs text-kum-400">
                  {satir.sonOynama ? formatDate(satir.sonOynama) : "—"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
