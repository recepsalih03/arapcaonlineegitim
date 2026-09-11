import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VideoEditForm } from "@/components/admin/video-edit-form";
import { VideoPublicToggle } from "@/components/admin/video-public-toggle";
import { VideoPlayer } from "@/components/video/video-player";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { gradeLabel } from "@/lib/constants";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { videoIzleyenleri } from "@/modules/video/progress";
import { signedGetUrl } from "@/lib/r2";
import { siteOrigin } from "@/lib/site";
import { listFoldersByGrade } from "@/modules/video/folders";
import { getVideo } from "@/modules/video/service";

export const metadata: Metadata = { title: "Video Düzenle" };

export default async function VideoDuzenlePage({
  params,
}: PageProps<"/yonetim/videolar/[id]">) {
  const { id } = await params;
  const [video, origin, foldersByGrade, izleyenler] = await Promise.all([
    getVideo(id),
    siteOrigin(),
    listFoldersByGrade(),
    videoIzleyenleri(id),
  ]);
  if (!video) notFound();

  const poster = video.posterKey
    ? await signedGetUrl(video.posterKey, 3600).catch(() => null)
    : null;

  return (
    <div className="space-y-5">
      <Link
        href="/yonetim/videolar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Videolar
      </Link>

      <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
        {video.title}
      </h1>

      <VideoPlayer
        src={`/api/videos/${video.id}/hls/${video.playlistName}`}
        poster={poster}
        title={video.title}
      />

      <Card>
        <CardHeader>
          <CardTitle>Bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoEditForm
            videoId={video.id}
            title={video.title}
            description={video.description}
            grades={video.grades.map((g) => g.gradeLevel)}
            isActive={video.isActive}
            foldersByGrade={foldersByGrade}
            selectedFolders={Object.fromEntries(
              video.grades.map((g) => [g.gradeLevel, g.folderId]),
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Herkese açık örnek video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-kum-500">
            Her sınıf için aynı anda yalnızca bir örnek video olabilir.
          </p>
          <VideoPublicToggle
            videoId={video.id}
            isPublic={video.isPublic}
            publicSlug={video.publicSlug}
            siteOrigin={origin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Öğrenci izlemeleri</CardTitle>
        </CardHeader>
        <CardContent>
          {izleyenler.length === 0 ? (
            <EmptyState title="Bu videoyu henüz kimse açmadı." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Öğrenci</Th>
                    <Th>Sınıf</Th>
                    <Th>İlerleme</Th>
                    <Th className="text-right">Kaldığı yer</Th>
                    <Th>Durum</Th>
                    <Th>Son izleme</Th>
                  </tr>
                </thead>
                <tbody>
                  {izleyenler.map((satir) => (
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
                      <Td className="min-w-[8rem]">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-kum-200">
                            <span
                              className={
                                satir.tamamlandi
                                  ? "block h-full rounded-full bg-zumrut-600"
                                  : "block h-full rounded-full bg-altin-400"
                              }
                              style={{ width: `${satir.yuzde}%` }}
                            />
                          </span>
                          <span className="tabular-nums text-xs text-kum-500">
                            %{satir.yuzde}
                          </span>
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-right tabular-nums text-kum-600">
                        {formatDuration(satir.positionSec)}
                      </Td>
                      <Td>
                        {satir.tamamlandi ? (
                          <Badge tone="yesil">İzledi</Badge>
                        ) : (
                          <Badge tone="altin">Devam ediyor</Badge>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-xs text-kum-400">
                        {formatDateTime(satir.sonIzleme)}
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
