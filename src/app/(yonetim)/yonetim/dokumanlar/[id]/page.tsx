import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { DocumentForm } from "@/components/admin/document-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteDocumentAction } from "@/modules/document/actions";
import { listDocFoldersByGrade } from "@/modules/document/folders";
import { getDocument } from "@/modules/document/service";

export async function generateMetadata({
  params,
}: PageProps<"/yonetim/dokumanlar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id);
  return { title: doc?.title ?? "Doküman" };
}

export default async function DokumanDuzenlePage({
  params,
}: PageProps<"/yonetim/dokumanlar/[id]">) {
  const { id } = await params;
  const [doc, foldersByGrade] = await Promise.all([
    getDocument(id),
    listDocFoldersByGrade(),
  ]);

  if (!doc) notFound();

  const selectedFolders: Record<number, string | null> = {};
  for (const g of doc.grades) {
    selectedFolders[g.gradeLevel] = g.folderId;
  }

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
        {doc.title}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Doküman bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentForm
            document={{
              id: doc.id,
              title: doc.title,
              description: doc.description,
              grades: doc.grades.map((g) => g.gradeLevel),
              isActive: doc.isActive,
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              fileSize: doc.fileSize,
            }}
            foldersByGrade={foldersByGrade}
            selectedFolders={selectedFolders}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tehlikeli alan</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfirmForm
            action={deleteDocumentAction}
            fields={{ documentId: doc.id, redirect: "/yonetim/dokumanlar" }}
            confirmMessage={`"${doc.title}" dokümanı kalıcı olarak silinsin mi?`}
          >
            Dokümanı sil
          </ConfirmForm>
        </CardContent>
      </Card>
    </div>
  );
}
