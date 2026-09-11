import { ArrowLeft, Laptop } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { StudentActions } from "@/components/admin/student-actions";
import {
  OgrenciOyunIlerlemesi,
  OgrenciVideoIlerlemesi,
} from "@/components/admin/student-progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { gradeLabel } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { maxDevices } from "@/modules/devices/service";
import { removeStudentDeviceAction } from "@/modules/students/actions";
import { getStudent } from "@/modules/students/service";
import { ogrencininOyunDurumu } from "@/modules/game/progress";
import { ogrencininVideoDurumu } from "@/modules/video/progress";

export const metadata: Metadata = { title: "Öğrenci" };

/** Destek görünümü: adminin öğrencinin cihazlarını görmesi (PROJE.md §7). */
export default async function OgrenciDetayPage({
  params,
}: PageProps<"/yonetim/ogrenciler/[id]">) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  // Öğrencinin sınıfı yoksa (beklenmez) ilerleme tabloları boş geçilir.
  const [videoDurumu, oyunDurumu] = student.gradeLevel
    ? await Promise.all([
        ogrencininVideoDurumu(student.id, student.gradeLevel),
        ogrencininOyunDurumu(student.id, student.gradeLevel),
      ])
    : [[], []];

  const label = student.fullName ?? student.username;

  return (
    <div className="space-y-6">
      <Link
        href="/yonetim/ogrenciler"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Öğrenciler
      </Link>

      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          {label}
          {student.gradeLevel ? (
            <Badge tone="yesil">{gradeLabel(student.gradeLevel)}</Badge>
          ) : null}
          {!student.isActive ? <Badge tone="kirmizi">Pasif</Badge> : null}
        </h1>
        <p className="mt-1 font-mono text-sm text-kum-500">{student.username}</p>
        <p className="mt-0.5 text-xs text-kum-400">
          Kayıt: {formatDate(student.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentActions
            studentId={student.id}
            gradeLevel={student.gradeLevel}
            isActive={student.isActive}
            studentLabel={label}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video izleme</CardTitle>
        </CardHeader>
        <CardContent>
          <OgrenciVideoIlerlemesi satirlar={videoDurumu} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oyunlar</CardTitle>
        </CardHeader>
        <CardContent>
          <OgrenciOyunIlerlemesi satirlar={oyunDurumu} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Cihazlar ({student.devices.length}/{maxDevices()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.devices.length === 0 ? (
            <EmptyState title="Bu öğrenci henüz hiçbir cihazdan giriş yapmamış." />
          ) : (
            <ul className="space-y-2">
              {student.devices.map((device) => (
                <li
                  key={device.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-kum-200 px-3.5 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-kum-100 text-kum-600">
                    <Laptop className="size-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-kum-900">
                      {device.deviceLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-kum-400">
                      Son giriş: {formatDateTime(device.lastSeenAt)}
                      {device.ipHint ? ` · ${device.ipHint}` : ""}
                    </p>
                  </div>
                  <ConfirmForm
                    action={removeStudentDeviceAction}
                    fields={{ studentId: student.id, deviceSessionId: device.id }}
                    confirmMessage="Bu cihazın oturumu sonlandırılsın mı?"
                    showFeedback={false}
                  >
                    Sil
                  </ConfirmForm>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
