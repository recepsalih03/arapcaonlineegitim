import { Globe, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { IconLinkButton } from "@/components/ui/icon-link";
import { VideoPublicToggle } from "@/components/admin/video-public-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";
import { deleteVideoAction } from "@/modules/video/actions";
import {
  KLASORSUZ_BASLIK,
  klasorOf,
  type VideoWithGrades,
} from "@/modules/video/service";

export function VideoList({
  videos,
  siteOrigin,
  /** Verilirse klasör sütunu o sınıfın klasörünü gösterir (sınıf paneli). */
  grade,
  /** videoId → { izleyen, bitiren } */
  izlemeOzeti,
}: {
  videos: VideoWithGrades[];
  siteOrigin: string;
  grade?: number;
  izlemeOzeti?: Map<string, { izleyen: number; bitiren: number }>;
}) {
  if (videos.length === 0) {
    return (
      <EmptyState
        title="Henüz video yok."
        action={
          <Button asChild>
            <Link href="/yonetim/videolar/yeni">Video yükle</Link>
          </Button>
        }
      />
    );
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>Başlık</Th>
            <Th>Klasör</Th>
            {grade ? null : <Th>Sınıflar</Th>}
            <Th className="text-right">Süre</Th>
            <Th>Durum</Th>
            {izlemeOzeti ? <Th className="text-right">İzleyen</Th> : null}
            <Th className="text-right">İşlem</Th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <Tr key={video.id}>
              <Td className="font-medium text-kum-900">
                <Link
                  href={`/yonetim/videolar/${video.id}`}
                  className="hover:text-zumrut-700"
                >
                  {video.title}
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-kum-500">
                {grade
                  ? (klasorOf(video, grade)?.name ?? KLASORSUZ_BASLIK)
                  : video.grades
                      .map(
                        (g) =>
                          `${g.gradeLevel}: ${g.folder?.name ?? KLASORSUZ_BASLIK}`,
                      )
                      .join(" · ")}
              </Td>
              {grade ? null : (
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {video.grades.map(({ gradeLevel }) => (
                      <Badge key={gradeLevel} tone="yesil">
                        {gradeLevel}
                      </Badge>
                    ))}
                  </span>
                </Td>
              )}
              <Td className="whitespace-nowrap text-right tabular-nums text-kum-600">
                {video.durationSec ? formatDuration(video.durationSec) : "—"}
              </Td>
              <Td>
                <span className="flex flex-wrap gap-1">
                  {video.isPublic ? (
                    <Badge tone="altin">
                      <Globe className="mr-1 size-3" aria-hidden />
                      Açık
                    </Badge>
                  ) : null}
                  {!video.isActive ? <Badge tone="kirmizi">Kapalı</Badge> : null}
                  {video.isActive && !video.isPublic ? (
                    <Badge tone="yesil">Yayında</Badge>
                  ) : null}
                </span>
              </Td>
              {izlemeOzeti ? (
                <Td className="whitespace-nowrap text-right tabular-nums text-kum-600">
                  {izlemeOzeti.get(video.id)?.bitiren ?? 0} /{" "}
                  {izlemeOzeti.get(video.id)?.izleyen ?? 0}
                </Td>
              ) : null}
              <Td>
                {/*
                  flex-nowrap: geniş ekranda bile alt satıra kayıyordu.
                  "İzle" ve "Düzenle" zaten aynı sayfaya gidiyordu, tek düğmeye
                  indirildi; public linki de video sayfasında duruyor.
                */}
                <div className="flex flex-nowrap items-center justify-end gap-1.5">
                  <IconLinkButton
                    href={`/yonetim/videolar/${video.id}`}
                    icon={SquarePen}
                    label="Videoyu aç (izle ve düzenle)"
                  />
                  <VideoPublicToggle
                    videoId={video.id}
                    isPublic={video.isPublic}
                    publicSlug={video.publicSlug}
                    siteOrigin={siteOrigin}
                    kompakt
                  />
                  <ConfirmForm
                    action={deleteVideoAction}
                    fields={{ videoId: video.id }}
                    confirmMessage={`"${video.title}" ve tüm video dosyaları kalıcı olarak silinsin mi?`}
                    showFeedback={false}
                    ikon={<Trash2 className="size-4" aria-hidden />}
                    ikonEtiketi="Videoyu sil"
                  />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
