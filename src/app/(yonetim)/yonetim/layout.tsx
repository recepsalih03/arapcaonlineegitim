import { AdminNav } from "@/components/layout/admin-nav";
import { Logo } from "@/components/layout/logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/modules/auth/session";

/** Yönetim paneli çerçevesi. Öğrenci buraya gelirse /panel'e yönlenir. */
export default async function YonetimLayout({
  children,
}: LayoutProps<"/yonetim">) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-kum-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="altin">Yönetim</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-kum-600 sm:inline">
              {admin.fullName ?? admin.username}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-4 md:flex-row md:gap-8 md:py-8">
        <aside className="shrink-0 md:w-56">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
