import { ArrowLeft, FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VideoPlayer } from "@/components/video/video-player";
import { formatDate } from "@/lib/utils";
import { signedGetUrl } from "@/lib/r2";
import { requireStudent } from "@/modules/auth/session";
import { ogrenciIzlemesi } from "@/modules/video/progress";
import { canWatch, getVideo, klasorOf } from "@/modules/video/service";

export async function generateMetadata({
  params,
}: PageProps<"/panel/videolar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id).catch(() => null);
  return { title: video?.title ?? "Video" };
}

export default async function OgrenciVideoPage({
  params,
}: PageProps<"/panel/videolar/[id]">) {
  const student = await requireStudent();
  const { id } = await params;

  const video = await getVideo(id);
  // Erişim kuralı tek yerde: canWatch. Sınıfı tutmayan öğrenciye 404 gösterilir
  // ki videonun varlığı bile sızmasın.
  if (!video || !canWatch(video, { kind: "student", gradeLevel: student.gradeLevel })) {
    notFound();
  }

  const klasor = klasorOf(video, student.gradeLevel);

  const [poster, izleme] = await Promise.all([
    video.posterKey
      ? signedGetUrl(video.posterKey, 3600).catch(() => null)
      : Promise.resolve(null),
    ogrenciIzlemesi(video.id, student.id),
  ]);

  return (
    <div className="space-y-4">
      <Link
        href="/panel/videolar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Videolar
      </Link>

      <VideoPlayer
        src={`/api/videos/${video.id}/hls/${video.playlistName}`}
        poster={poster}
        title={video.title}
        videoId={video.id}
        baslangicSaniye={izleme?.tamamlandi ? 0 : (izleme?.positionSec ?? 0)}
      />

      {izleme && !izleme.tamamlandi && izleme.positionSec > 10 ? (
        <p className="text-sm text-kum-500">
        </p>
      ) : null}

      <div>
        {klasor ? (
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-zumrut-700">
            <FolderOpen className="size-4" aria-hidden />
            {klasor.name}
          </p>
        ) : null}
        <h1 className="text-lg font-semibold tracking-tight text-zumrut-900 sm:text-xl">
          {video.title}
        </h1>
        <p className="mt-1 text-xs text-kum-400">{formatDate(video.createdAt)}</p>
        {video.description ? (
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-kum-600">
            {video.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
