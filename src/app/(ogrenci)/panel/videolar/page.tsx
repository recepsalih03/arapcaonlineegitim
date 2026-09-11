import type { Metadata } from "next";
import { FolderOpen, MonitorPlay } from "lucide-react";
import Link from "next/link";

import { IzlemeCubugu } from "@/components/video/watch-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { gradeLabel } from "@/lib/constants";
import { formatDate, formatDuration } from "@/lib/utils";
import { requireStudent } from "@/modules/auth/session";
import { ogrencininIzlemeleri } from "@/modules/video/progress";
import {
  KLASORSUZ_BASLIK,
  gruplaKlasore,
  listVideosForGrade,
} from "@/modules/video/service";

export const metadata: Metadata = { title: "Videolar" };

/**
 * Öğrenci yalnızca kendi sınıfının videolarını görür.
 * Videolar adminin oluşturduğu klasörlere göre gruplanır; klasörsüz olanlar
 * en sonda "Diğer" başlığı altında toplanır. Tek grup varsa başlık gösterilmez.
 */
export default async function OgrenciVideolarPage() {
  const student = await requireStudent();
  const [videos, izlemeler] = await Promise.all([
    listVideosForGrade(student.gradeLevel),
    ogrencininIzlemeleri(student.id),
  ]);
  const gruplar = gruplaKlasore(videos, student.gradeLevel);
  const izlenenSayisi = videos.filter(
    (v) => izlemeler.get(v.id)?.tamamlandi,
  ).length;
  /*
   * Başlıkları "birden fazla grup varsa" göstermek yanlıştı: öğretmen bütün
   * videoları tek bir klasöre koyduğunda öğrenci klasörü hiç göremiyordu.
   * Doğru ölçüt, ortada GERÇEK bir klasör olup olmaması.
   */
  const baslikGoster = gruplar.some((g) => g.klasorAdi !== KLASORSUZ_BASLIK);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Ders videoları
        </h1>
        <p className="mt-1 text-sm text-kum-500">
          {gradeLabel(student.gradeLevel)} · {videos.length} video
          {videos.length > 0 ? ` · ${izlenenSayisi} izlendi` : ""}
        </p>
      </div>

      {videos.length === 0 ? (
        <EmptyState
          title="Henüz video yok."
          description="Öğretmenin yeni ders videosu eklediğinde burada göreceksin."
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
                    {grup.videolar.length} video
                  </span>
                </h2>
              ) : null}

              <ul className="space-y-2.5">
                {grup.videolar.map((video) => {
                  const izleme = izlemeler.get(video.id);
                  return (
                  <li key={video.id}>
                    <Link
                      href={`/panel/videolar/${video.id}`}
                      className="flex gap-3 rounded-card border border-kum-200 bg-white p-3.5 transition-colors hover:border-zumrut-300 hover:bg-zumrut-50/40 sm:p-4"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-zumrut-50 text-zumrut-700">
                        <MonitorPlay className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-kum-900">
                          {video.title}
                        </span>
                        {video.description ? (
                          <span className="mt-0.5 line-clamp-2 block text-sm text-kum-500">
                            {video.description}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-xs text-kum-400">
                          {formatDate(video.createdAt)}
                          {video.durationSec
                            ? ` · ${formatDuration(video.durationSec)}`
                            : ""}
                        </span>
                        {izleme ? (
                          <IzlemeCubugu
                            positionSec={izleme.positionSec}
                            durationSec={izleme.durationSec}
                            tamamlandi={izleme.tamamlandi}
                          />
                        ) : null}
                      </span>
                    </Link>
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
