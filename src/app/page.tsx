import { BookOpen, MonitorPlay, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GRADES, gradeLabel } from "@/lib/constants";
import { getSessionUser } from "@/modules/auth/session";
import { listPublicVideosByGrade } from "@/modules/video/service";

/**
 * Ziyaretçi ana sayfası. Girişsiz görülebilen tek içerik, admin tarafından
 * "public" işaretlenmiş örnek videolardır.
 *
 * Girişli kullanıcı buraya hiç düşmez: tanıtım sayfasında "Giriş Yap" görmek
 * anlamsız, doğrudan kendi paneline gider.
 */
export default async function AnaSayfa() {
  const user = await getSessionUser().catch(() => null);
  if (user) {
    redirect(user.role === "ADMIN" ? "/yonetim" : "/panel");
  }

  // Veritabanı henüz kurulmamışsa ana sayfa yine açılmalı.
  const publicVideos = await listPublicVideosByGrade().catch(
    () => new Map<number, never>(),
  );
  // Örnek dersi olmayan sınıf için boş kart göstermenin bir faydası yok.
  const ornekliSiniflar = GRADES.filter((grade) => publicVideos.get(grade));

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="desen-zemin border-b border-kum-200">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:py-20">
            <Badge tone="altin">5, 6, 7 ve 8. sınıflar</Badge>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-zumrut-900 sm:text-4xl">
              Sınıf seviyene özel
              <br className="hidden sm:block" /> online Arapça dersleri
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-kum-600">
              Ders videoları, duyurular ve anketler tek bir yerde. Telefonundan
              da rahatça takip et; kendi sınıfının içeriği panelinde hazır.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/giris">Öğrenci girişi</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/oyunlar">Oyunları dene</Link>
              </Button>
            </div>
          </div>
        </section>

        {ornekliSiniflar.length > 0 ? (
          <section className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <h2 className="text-lg font-semibold text-kum-900">Örnek dersler</h2>
            <p className="mt-1 text-sm text-kum-500">
              Bu dersleri giriş yapmadan izleyebilirsiniz.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
              {ornekliSiniflar.map((grade) => {
                const video = publicVideos.get(grade)!;
                return (
                  <Card key={grade} className="overflow-hidden">
                    {/*
                      items-start şart: flex sütununda hizalama varsayılan olarak
                      "stretch" ve rozet kart genişliğine yayılıyordu.
                    */}
                    <CardContent className="flex h-full flex-col items-start p-3.5 sm:p-5">
                      <Badge tone="yesil">{gradeLabel(grade)}</Badge>
                      <p className="mt-2.5 w-full flex-1 text-sm font-medium text-kum-900 sm:text-base">
                        {video.title}
                      </p>
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="mt-3 sm:h-11 sm:text-sm"
                        block
                      >
                        <Link href={`/izle/${video.publicSlug}`}>
                          <MonitorPlay className="size-4 shrink-0" aria-hidden />
                          İzle
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="border-t border-kum-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-3 sm:py-12">
            {[
              {
                icon: BookOpen,
                title: "Sınıfına özel içerik",
                text: "Panelinde yalnızca kendi seviyendeki ders videoları ve duyurular görünür.",
              },
              {
                icon: MonitorPlay,
                title: "Telefonda akıcı",
                text: "Oynatıcı mobil için tasarlandı; tam ekran ve dokunmatik kontroller rahat.",
              },
              {
                icon: ShieldCheck,
                title: "Hesabın sende",
                text: "İlk girişte kullanıcı adını ve şifreni kendin belirlersin, cihazlarını kendin yönetirsin.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span className="grid size-10 place-items-center rounded-xl bg-zumrut-50 text-zumrut-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-medium text-kum-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-kum-500">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
