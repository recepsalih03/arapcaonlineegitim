import { Download, Eye, FileText, FolderOpen } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { gradeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { requireStudent } from "@/modules/auth/session";
import {
  DOC_KLASORSUZ_BASLIK,
  gruplaDocKlasore,
  listDocumentsForGrade,
  docTypeLabel,
  formatFileSize,
} from "@/modules/document/service";

export const metadata: Metadata = { title: "Dokümanlar" };

/**
 * Öğrenci yalnızca kendi sınıfının dokümanlarını görür.
 * Dokümanlar adminin oluşturduğu klasörlere göre gruplanır.
 */
export default async function OgrenciDokumanlarPage() {
  const student = await requireStudent();
  const documents = await listDocumentsForGrade(student.gradeLevel);
  const gruplar = gruplaDocKlasore(documents, student.gradeLevel);
  const baslikGoster = gruplar.some((g) => g.klasorAdi !== DOC_KLASORSUZ_BASLIK);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Dokümanlar
        </h1>
        <p className="mt-1 text-sm text-kum-500">
          {gradeLabel(student.gradeLevel)} · {documents.length} doküman
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="Henüz doküman yok."
          description="Öğretmenin yeni bir doküman eklediğinde burada göreceksin."
        />
      ) : (
        <div className="space-y-6">
          {gruplar.map((grup) => (
            <section key={grup.klasorAdi}>
              {baslikGoster ? (
                <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-zumrut-800">
                  <FolderOpen className="size-4 text-zumrut-600" aria-hidden />
                  {grup.klasorAdi}
                  <span className="text-xs font-normal text-kum-400">
                    {grup.dokumanlar.length} doküman
                  </span>
                </h2>
              ) : null}

              <ul className="space-y-2.5">
                {grup.dokumanlar.map((doc) => {
                  const isPdf = doc.mimeType === "application/pdf";
                  return (
                    <li key={doc.id}>
                      <a
                        href={`/api/documents/${doc.id}`}
                        target={isPdf ? "_blank" : undefined}
                        rel={isPdf ? "noopener noreferrer" : undefined}
                        className="flex gap-3 rounded-card border border-kum-200 bg-white p-3.5 transition-colors hover:border-zumrut-300 hover:bg-zumrut-50/40 sm:p-4"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-zumrut-50 text-zumrut-700">
                          <FileText className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-kum-900">
                            {doc.title}
                          </span>
                          {doc.description ? (
                            <span className="mt-0.5 line-clamp-2 block text-sm text-kum-500">
                              {doc.description}
                            </span>
                          ) : null}
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-kum-400">
                            <span>{docTypeLabel(doc.mimeType)}</span>
                            <span>·</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>·</span>
                            <span>{formatDate(doc.createdAt)}</span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center text-zumrut-600">
                          {isPdf ? (
                            <Eye className="size-5" aria-hidden />
                          ) : (
                            <Download className="size-5" aria-hidden />
                          )}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
