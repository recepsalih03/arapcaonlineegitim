import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DocumentForm } from "@/components/admin/document-form";
import { Card, CardContent } from "@/components/ui/card";
import { listDocFoldersByGrade } from "@/modules/document/folders";

export const metadata: Metadata = { title: "Yeni Doküman" };

export default async function YeniDokumanPage() {
  const foldersByGrade = await listDocFoldersByGrade();

  return (
    <div className="space-y-5">
      <Link
        href="/yonetim/dokumanlar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dokümanlar
      </Link>

      <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
        Yeni doküman yükle
      </h1>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DocumentForm foldersByGrade={foldersByGrade} />
        </CardContent>
      </Card>
    </div>
  );
}
