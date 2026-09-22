import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EklendiBandi } from "@/components/admin/created-banner";
import { DocumentList } from "@/components/admin/document-list";
import { Button } from "@/components/ui/button";
import { listAllDocuments } from "@/modules/document/service";

export const metadata: Metadata = { title: "Dokümanlar" };

export default async function YonetimDokumanlarPage({
  searchParams,
}: PageProps<"/yonetim/dokumanlar">) {
  const eklendi = String((await searchParams)?.eklendi ?? "");
  const documents = await listAllDocuments();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
            Dokümanlar
          </h1>
          <p className="mt-1 text-sm text-kum-500">{documents.length} doküman</p>
        </div>
        <Button asChild>
          <Link href="/yonetim/dokumanlar/yeni">
            <Plus className="size-4" aria-hidden />
            Doküman yükle
          </Link>
        </Button>
      </div>

      {eklendi ? <EklendiBandi tur="Doküman" ad={eklendi} /> : null}

      <DocumentList documents={documents} />
    </div>
  );
}
