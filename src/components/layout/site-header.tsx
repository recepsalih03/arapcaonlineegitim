import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/modules/auth/session";

/** Ziyaretçi/genel sayfaların üst çubuğu. */
export async function SiteHeader() {
  const user = await getSessionUser();
  const panelHref = user?.role === "ADMIN" ? "/yonetim" : "/panel";

  return (
    <header className="sticky top-0 z-40 border-b border-kum-200 bg-kum-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/hakkimizda">Hakkımızda</Link>
          </Button>
          {user ? (
            <Button asChild size="sm">
              <Link href={panelHref}>Ana Sayfa</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/giris">Giriş Yap</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
