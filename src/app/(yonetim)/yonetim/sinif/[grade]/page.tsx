import { FileText, MonitorPlay, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentFolderManager } from "@/components/admin/document-folder-manager";
import { DocumentList } from "@/components/admin/document-list";
import { FolderManager } from "@/components/admin/folder-manager";
import { StudentCreateForm } from "@/components/admin/student-create-form";
import { StudentTable } from "@/components/admin/student-table";
import { VideoList } from "@/components/admin/video-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GRADES, gradeLabel, parseGrade } from "@/lib/constants";
import { siteOrigin } from "@/lib/site";
import { listStudents } from "@/modules/students/service";
import { listDocFoldersForGrade } from "@/modules/document/folders";
import { listDocumentsForGrade } from "@/modules/document/service";
import { listFoldersForGrade } from "@/modules/video/folders";
import { listVideosForGrade } from "@/modules/video/service";

export async function generateStaticParams() {
  return GRADES.map((grade) => ({ grade: String(grade) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/yonetim/sinif/[grade]">): Promise<Metadata> {
  const { grade } = await params;
  const parsed = parseGrade(grade);
  return { title: parsed ? gradeLabel(parsed) : "Sınıf" };
}

/**
 * Sınıfa özel panel: o sınıfın öğrencileri ve videoları.
 *
 * Duyuru ve anket bölümleri bilerek YOK: ikisi de zaten birden çok sınıfa
 * gönderiliyor ve kendi sayfalarında sınıf seçimi var. Aynı formu her sınıf
 * panelinde tekrar göstermek hem kalabalık yapıyor hem de aynı duyurunun
 * yanlışlıkla iki kez oluşturulmasına davetiye çıkarıyordu.
 */
export default async function SinifPaneliPage({
  params,
}: PageProps<"/yonetim/sinif/[grade]">) {
  const { grade: rawGrade } = await params;
  const grade = parseGrade(rawGrade);
  if (!grade) notFound();

  const [students, videos, origin, folders, documents, docFolders] = await Promise.all([
    listStudents(grade),
    listVideosForGrade(grade),
    siteOrigin(),
    listFoldersForGrade(grade),
    listDocumentsForGrade(grade),
    listDocFoldersForGrade(grade),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          {gradeLabel(grade)}
        </h1>
        <p className="mt-1 text-sm text-kum-500">
          {students.length} öğrenci · {videos.length} video · {documents.length} doküman
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold text-kum-900">
          <Users className="size-4.5 text-zumrut-700" aria-hidden />
          Öğrenciler
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>Yeni öğrenci oluştur</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentCreateForm fixedGrade={grade} />
          </CardContent>
        </Card>

        <StudentTable students={students} showGrade={false} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-kum-900">
            <MonitorPlay className="size-4.5 text-zumrut-700" aria-hidden />
            Videolar
          </h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/yonetim/videolar/yeni">
              <Plus className="size-4" aria-hidden />
              Video yükle
            </Link>
          </Button>
        </div>
        <VideoList videos={videos} siteOrigin={origin} grade={grade} />

        <Card>
          <CardHeader>
            <CardTitle>Bu sınıfın video klasörleri</CardTitle>
          </CardHeader>
          <CardContent>
            <FolderManager folders={folders} grade={grade} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-kum-900">
            <FileText className="size-4.5 text-zumrut-700" aria-hidden />
            Dokümanlar
          </h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/yonetim/dokumanlar/yeni">
              <Plus className="size-4" aria-hidden />
              Doküman yükle
            </Link>
          </Button>
        </div>
        <DocumentList documents={documents} grade={grade} />

        <Card>
          <CardHeader>
            <CardTitle>Bu sınıfın doküman klasörleri</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentFolderManager folders={docFolders} grade={grade} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
