import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AnnouncementForm } from "@/components/admin/announcement-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { gradeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { deleteAnnouncementAction } from "@/modules/announcements/actions";
import { listAllAnnouncements } from "@/modules/announcements/service";

export const metadata: Metadata = { title: "Duyurular" };

export default async function YonetimDuyurularPage() {
  const announcements = await listAllAnnouncements();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Duyurular
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni duyuru</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>

      {announcements.length === 0 ? (
        <EmptyState title="Henüz duyuru yok." />
      ) : (
        <ul className="space-y-3">
          {announcements.map((announcement) => (
            <li
              key={announcement.id}
              className="rounded-card border border-kum-200 bg-white p-4"
            >
              <p className="text-xs text-kum-400">
                {formatDate(announcement.createdAt)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-medium text-kum-900">{announcement.title}</span>
                {!announcement.isActive ? (
                  <Badge tone="kirmizi">Yayında değil</Badge>
                ) : null}
              </p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {announcement.grades.map(({ gradeLevel }) => (
                  <Badge key={gradeLevel} tone="yesil">
                    {gradeLabel(gradeLevel)}
                  </Badge>
                ))}
              </p>
              <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-kum-600">
                {announcement.body}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/yonetim/duyurular/${announcement.id}`}>
                    <Pencil className="size-4" aria-hidden />
                    Düzenle
                  </Link>
                </Button>
                <ConfirmForm
                  action={deleteAnnouncementAction}
                  fields={{ announcementId: announcement.id }}
                  confirmMessage={`"${announcement.title}" duyurusu silinsin mi?`}
                  showFeedback={false}
                >
                  Sil
                </ConfirmForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
