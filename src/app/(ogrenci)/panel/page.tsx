import { ChevronRight, Megaphone, MonitorPlay, Vote } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { gradeLabel } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { listAnnouncementsForGrade } from "@/modules/announcements/service";
import { requireStudent } from "@/modules/auth/session";
import { listSurveysForStudent } from "@/modules/surveys/service";
import { listVideosForGrade } from "@/modules/video/service";

export default async function PanelAnaSayfa() {
  const student = await requireStudent();

  const [videos, announcements, surveys] = await Promise.all([
    listVideosForGrade(student.gradeLevel),
    listAnnouncementsForGrade(student.gradeLevel),
    listSurveysForStudent(student.id, student.gradeLevel),
  ]);

  const pendingSurveys = surveys.filter((survey) => !survey.hasVoted);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Merhaba{student.fullName ? `, ${student.fullName.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-kum-500">
          {gradeLabel(student.gradeLevel)} içeriklerin burada.
        </p>
      </div>

      {/*
        Mobilde bilerek 3 sütun: üç sayı için üç tam genişlik kart, telefonda
        ekranın tamamını yiyip kullanıcıyı boşuna kaydırtıyordu.
      */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <OzetKarti
          href="/panel/videolar"
          icon={MonitorPlay}
          label="Ders videosu"
          count={videos.length}
        />
        <OzetKarti
          href="/panel/duyurular"
          icon={Megaphone}
          label="Duyuru"
          count={announcements.length}
        />
        <OzetKarti
          href="/panel/anketler"
          icon={Vote}
          label="Bekleyen anket"
          count={pendingSurveys.length}
          vurgula={pendingSurveys.length > 0}
        />
      </div>

      {/* Duyuru yoksa bölüm hiç açılmasın: boş başlık gürültüden ibaret. */}
      {announcements.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-kum-900">Son duyurular</h2>
            <Link
              href="/panel/duyurular"
              className="text-sm font-medium text-zumrut-700 hover:text-zumrut-800"
            >
              Tümü
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-4 sm:p-5">
                  <p className="text-xs text-kum-400">
                    {formatDate(announcement.createdAt)}
                  </p>
                  <h3 className="mt-1 font-medium text-kum-900">
                    {announcement.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-kum-600">
                    {announcement.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-kum-900">Videolar</h2>
          <Link
            href="/panel/videolar"
            className="text-sm font-medium text-zumrut-700 hover:text-zumrut-800"
          >
            Tümü
          </Link>
        </div>

        {videos.length === 0 ? (
          <EmptyState title="Sınıfın için henüz video eklenmemiş." />
        ) : (
          <div className="space-y-2">
            {videos.slice(0, 4).map((video) => (
              <Link
                key={video.id}
                href={`/panel/videolar/${video.id}`}
                className="flex items-center gap-3 rounded-xl border border-kum-200 bg-white px-4 py-3 transition-colors hover:border-zumrut-300 hover:bg-zumrut-50/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zumrut-50 text-zumrut-700">
                  <MonitorPlay className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-kum-900">
                    {video.title}
                  </span>
                  <span className="block text-xs text-kum-400">
                    {formatDate(video.createdAt)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-kum-400" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OzetKarti({
  href,
  icon: Icon,
  label,
  count,
  vurgula = false,
}: {
  href: string;
  icon: typeof MonitorPlay;
  label: string;
  count: number;
  vurgula?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-card border bg-white p-3 text-center transition-colors sm:p-4",
        vurgula
          ? "border-altin-300 bg-altin-50/60"
          : "border-kum-200 hover:border-zumrut-300",
      )}
    >
      {/* Dar sütunda "Seni bekliyor" rozeti sığmıyor; yerine köşe noktası. */}
      {vurgula ? (
        <span
          className="absolute right-2 top-2 size-2 rounded-full bg-altin-400"
          aria-hidden
        />
      ) : null}
      <Icon className="mx-auto size-4 text-kum-400" aria-hidden />
      <span className="mt-1 block text-2xl font-semibold leading-tight text-zumrut-800">
        {count}
      </span>
      <span className="mt-0.5 block text-[11px] leading-tight text-kum-500 sm:text-xs">
        {label}
      </span>
    </Link>
  );
}
