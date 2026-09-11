import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EklendiBandi } from "@/components/admin/created-banner";
import { VideoList } from "@/components/admin/video-list";
import { Button } from "@/components/ui/button";
import { siteOrigin } from "@/lib/site";
import { videoIzlemeOzetleri } from "@/modules/video/progress";
import { listAllVideos } from "@/modules/video/service";

export const metadata: Metadata = { title: "Videolar" };

export default async function YonetimVideolarPage({
  searchParams,
}: PageProps<"/yonetim/videolar">) {
  const eklendi = String((await searchParams)?.eklendi ?? "");
  const [videos, origin] = await Promise.all([listAllVideos(), siteOrigin()]);
  const izlemeOzeti = await videoIzlemeOzetleri(videos.map((v) => v.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
            Videolar
          </h1>
          <p className="mt-1 text-sm text-kum-500">{videos.length} video</p>
        </div>
        <Button asChild>
          <Link href="/yonetim/videolar/yeni">
            <Plus className="size-4" aria-hidden />
            Video yükle
          </Link>
        </Button>
      </div>

      {eklendi ? <EklendiBandi tur="Video" ad={eklendi} /> : null}

      <VideoList
        videos={videos}
        siteOrigin={origin}
        izlemeOzeti={izlemeOzeti}
      />
    </div>
  );
}
