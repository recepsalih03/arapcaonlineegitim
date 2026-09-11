import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnnouncementForm } from "@/components/admin/announcement-form";
import { Card, CardContent } from "@/components/ui/card";
import { getAnnouncement } from "@/modules/announcements/service";

export const metadata: Metadata = { title: "Duyuru Düzenle" };

export default async function DuyuruDuzenlePage({
  params,
}: PageProps<"/yonetim/duyurular/[id]">) {
  const { id } = await params;
  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/yonetim/duyurular"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Duyurular
      </Link>

      <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
        Duyuruyu düzenle
      </h1>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <AnnouncementForm
            announcement={{
              id: announcement.id,
              title: announcement.title,
              body: announcement.body,
              grades: announcement.grades.map((g) => g.gradeLevel),
              isActive: announcement.isActive,
              startsAt: announcement.startsAt,
              endsAt: announcement.endsAt,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
