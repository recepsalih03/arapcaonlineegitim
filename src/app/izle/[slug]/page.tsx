import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { VideoPlayer } from "@/components/video/video-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { gradeLabel } from "@/lib/constants";
import { signedGetUrl } from "@/lib/r2";
import { getPublicVideoBySlug } from "@/modules/video/service";

/** Girişsiz izlenebilen örnek ders (PROJE.md §6d). */

export async function generateMetadata({
  params,
}: PageProps<"/izle/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const video = await getPublicVideoBySlug(slug).catch(() => null);
  return { title: video?.title ?? "Örnek Ders" };
}

export default async function PublicIzlePage({
  params,
}: PageProps<"/izle/[slug]">) {
  const { slug } = await params;
  const video = await getPublicVideoBySlug(slug);
  if (!video) notFound();

  const poster = video.posterKey
    ? await signedGetUrl(video.posterKey, 3600).catch(() => null)
    : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="altin">Örnek ders</Badge>
          {video.grades.map(({ gradeLevel }) => (
            <Badge key={gradeLevel} tone="yesil">
              {gradeLabel(gradeLevel)}
            </Badge>
          ))}
        </div>

        <h1 className="mt-3 text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          {video.title}
        </h1>

        <div className="mt-4">
          <VideoPlayer
            src={`/api/videos/${video.id}/hls/${video.playlistName}`}
            poster={poster}
            title={video.title}
          />
        </div>

        {video.description ? (
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-kum-600">
            {video.description}
          </p>
        ) : null}

        <div className="mt-8 rounded-card border border-zumrut-200 bg-zumrut-50 p-5">
          <p className="font-medium text-zumrut-900">
            Tüm derslere erişmek ister misiniz?
          </p>
          <p className="mt-1 text-sm text-zumrut-800/80">
            Öğrenci hesabınızla giriş yaparak sınıfınızın bütün ders videolarını
            izleyebilirsiniz.
          </p>
          <Button asChild className="mt-4">
            <Link href="/giris">Öğrenci girişi</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
