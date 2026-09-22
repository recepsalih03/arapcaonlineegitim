import { FileText, Pencil } from "lucide-react";
import Link from "next/link";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { docTypeLabel, formatFileSize } from "@/lib/utils";
import { deleteDocumentAction } from "@/modules/document/actions";
import type { DocumentWithGrades } from "@/modules/document/service";

export function DocumentList({
  documents,
  grade,
}: {
  documents: DocumentWithGrades[];
  grade?: number;
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="Henüz doküman yok."
        description="PDF, Word veya diğer dosyaları buradan yükleyebilirsiniz."
        action={
          <Button asChild>
            <Link href="/yonetim/dokumanlar/yeni">Doküman yükle</Link>
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
            <Th>Doküman</Th>
            <Th>Tür</Th>
            <Th>Boyut</Th>
            {!grade ? <Th>Sınıflar</Th> : null}
            <Th>Durum</Th>
            <Th className="text-right">İşlem</Th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <Tr key={doc.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zumrut-50 text-zumrut-700">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/yonetim/dokumanlar/${doc.id}`}
                      className="block truncate font-medium text-kum-900 hover:text-zumrut-700"
                    >
                      {doc.title}
                    </Link>
                    <span className="text-xs text-kum-400">{doc.fileName}</span>
                  </div>
                </div>
              </Td>
              <Td className="whitespace-nowrap text-kum-600">
                {docTypeLabel(doc.mimeType)}
              </Td>
              <Td className="whitespace-nowrap text-kum-600">
                {formatFileSize(doc.fileSize)}
              </Td>
              {!grade ? (
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {doc.grades.map(({ gradeLevel }) => (
                      <Badge key={gradeLevel} tone="yesil">
                        {gradeLevel}
                      </Badge>
                    ))}
                  </span>
                </Td>
              ) : null}
              <Td>
                {doc.isActive ? (
                  <Badge tone="yesil">Yayında</Badge>
                ) : (
                  <Badge tone="kirmizi">Kapalı</Badge>
                )}
              </Td>
              <Td>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/yonetim/dokumanlar/${doc.id}`}>
                      <Pencil className="size-4" aria-hidden />
                      Düzenle
                    </Link>
                  </Button>
                  <ConfirmForm
                    action={deleteDocumentAction}
                    fields={{ documentId: doc.id }}
                    confirmMessage={`"${doc.title}" dokümanı silinsin mi?`}
                    showFeedback={false}
                  >
                    Sil
                  </ConfirmForm>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
