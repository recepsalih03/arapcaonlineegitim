import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { listAnnouncementsForGrade } from "@/modules/announcements/service";
import { requireStudent } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Duyurular" };

export default async function OgrenciDuyurularPage() {
  const student = await requireStudent();
  const announcements = await listAnnouncementsForGrade(student.gradeLevel);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
        Duyurular
      </h1>

      {announcements.length === 0 ? (
        <EmptyState title="Henüz duyuru yok." />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs text-kum-400">
                  {formatDate(announcement.createdAt)}
                </p>
                <h2 className="mt-1 font-medium text-kum-900">
                  {announcement.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-kum-600">
                  {announcement.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
