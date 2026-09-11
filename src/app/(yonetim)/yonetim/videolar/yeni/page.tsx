import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { VideoUploader } from "@/components/admin/video-uploader";
import { listFoldersByGrade } from "@/modules/video/folders";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { isR2Configured } from "@/lib/env";

export const metadata: Metadata = { title: "Video Yükle" };

export default async function YeniVideoPage() {
  const foldersByGrade = await listFoldersByGrade();

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
        Video yükle
      </h1>

      {isR2Configured() ? null : (
        <Alert tone="error">
          Cloudflare R2 ayarları eksik. Sunucudaki <code>.env</code> dosyasında{" "}
          <code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>,{" "}
          <code>R2_SECRET_ACCESS_KEY</code> ve <code>R2_BUCKET</code> değerlerini
          doldurmadan yükleme yapılamaz.
        </Alert>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <VideoUploader foldersByGrade={foldersByGrade} />
        </CardContent>
      </Card>

    </div>
  );
}
