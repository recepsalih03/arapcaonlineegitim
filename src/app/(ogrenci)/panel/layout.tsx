import { Logo } from "@/components/layout/logo";
import { LogoutButton } from "@/components/layout/logout-button";
import {
  PanelNavDesktop,
  PanelNavMobile,
} from "@/components/layout/panel-nav";
import { Badge } from "@/components/ui/badge";
import { gradeLabel } from "@/lib/constants";
import { requireStudent } from "@/modules/auth/session";

/** Öğrenci paneli çerçevesi. Admin buraya gelirse /yonetim'e yönlenir. */
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const student = await requireStudent();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-kum-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Badge tone="yesil" className="hidden sm:inline-flex">
              {gradeLabel(student.gradeLevel)}
            </Badge>
            <span className="max-w-[9rem] truncate text-sm text-kum-600">
              {student.fullName ?? student.username}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-4 py-6 pb-24 md:py-8 md:pb-8">
        <aside className="hidden w-52 shrink-0 md:block">
          <PanelNavDesktop />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <PanelNavMobile />
    </div>
  );
}
