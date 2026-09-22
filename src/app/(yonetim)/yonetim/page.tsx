import { FileText, Globe, Megaphone, Users, Vote } from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { GRADES, gradeLabel } from "@/lib/constants";
import { isR2Configured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { countStudentsByGrade } from "@/modules/students/service";
import { countDocumentsByGrade } from "@/modules/document/service";
import { countVideosByGrade, listPublicVideosByGrade } from "@/modules/video/service";

/** Genel panel: tüm sınıfların özeti (PROJE.md §7 "Panel yapısı"). */
export default async function YonetimGenelPage() {
  const [students, videos, documents, publicVideos, announcementCount, surveyCount] =
    await Promise.all([
      countStudentsByGrade(),
      countVideosByGrade(),
      countDocumentsByGrade(),
      listPublicVideosByGrade(),
      prisma.announcement.count({ where: { isActive: true } }),
      prisma.survey.count({ where: { isActive: true } }),
    ]);

  const totalStudents = Object.values(students).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Genel bakış
        </h1>
      </div>

      {!isR2Configured() ? (
        <Alert tone="warning">
          Cloudflare R2 ayarları eksik olduğu için video yükleyemezsiniz. Sunucudaki{" "}
          <code>.env</code> dosyasında <code>R2_*</code> değişkenlerini doldurun.
        </Alert>
      ) : null}

      {/* Mobilde 3 sütun: üç sayı için üç tam genişlik kart telefonda israftı. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <OzetKutusu icon={Users} label="Aktif öğrenci" value={totalStudents} />
        <OzetKutusu icon={FileText} label="Doküman" value={Object.values(documents).reduce((a, b) => a + b, 0)} />
        <OzetKutusu icon={Megaphone} label="Yayında duyuru" value={announcementCount} />
        <OzetKutusu icon={Vote} label="Açık anket" value={surveyCount} />
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-kum-900">Sınıflar</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {GRADES.map((grade) => {
            const publicVideo = publicVideos.get(grade);
            return (
              <Link key={grade} href={`/yonetim/sinif/${grade}`}>
                <Card className="h-full transition-colors hover:border-zumrut-300">
                  <CardContent className="p-3.5 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-zumrut-800">
                        {gradeLabel(grade)}
                      </span>
                      {publicVideo ? (
                        <Globe
                          className="size-4 shrink-0 text-altin-500"
                          aria-label="Örnek video var"
                        />
                      ) : null}
                    </div>
                    <dl className="mt-2 flex gap-4 text-sm">
                      <div>
                        <dt className="text-xs text-kum-500">Öğrenci</dt>
                        <dd className="font-semibold text-kum-900">
                          {students[grade] ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-kum-500">Video</dt>
                        <dd className="font-semibold text-kum-900">
                          {videos[grade] ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-kum-500">Doküman</dt>
                        <dd className="font-semibold text-kum-900">
                          {documents[grade] ?? 0}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}

function OzetKutusu({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-3 text-center sm:p-4">
        <Icon className="mx-auto size-4 text-kum-400" aria-hidden />
        <p className="mt-1 text-2xl font-semibold leading-tight text-zumrut-800">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] leading-tight text-kum-500 sm:text-xs">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

