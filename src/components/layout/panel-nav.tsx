"use client";

import {
  Gamepad2,
  Home,
  Megaphone,
  MonitorPlay,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { OYUNLAR_OGRENCIYE_ACIK } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Öğrenci paneli gezinmesi. Mobilde alt çubuk (tek elle erişilebilir),
 * masaüstünde sol sütun (PROJE.md §8).
 *
 * DİKKAT: Menü tanımı bilerek BU DOSYADA duruyor, layout'tan prop olarak
 * geçirilmiyor. İkonlar React bileşeni yani fonksiyondur; fonksiyon sunucu
 * bileşeninden istemci bileşenine geçirilemez ("Functions cannot be passed
 * directly to Client Components") ve sayfa hiç render olmaz.
 */
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Alt sayfaları da aktif saymak için (ör. /panel/videolar/abc). */
  matchPrefix?: boolean;
};

const NAV: NavItem[] = [
  { href: "/panel", label: "Ana Sayfa", icon: Home },
  { href: "/panel/videolar", label: "Videolar", icon: MonitorPlay, matchPrefix: true },
  // Oyunlar henüz yayında değil; bayrak açılınca menüye girer.
  ...(OYUNLAR_OGRENCIYE_ACIK
    ? [
        {
          href: "/panel/oyun",
          label: "Oyunlar",
          icon: Gamepad2,
          matchPrefix: true,
        } satisfies NavItem,
      ]
    : []),
  { href: "/panel/duyurular", label: "Duyurular", icon: Megaphone },
  { href: "/panel/hesabim", label: "Hesabım", icon: UserCog },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.matchPrefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}

/** Mobil: ekranın altına sabitlenen çubuk. */
export function PanelNavMobile() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-kum-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Panel menüsü"
    >
      <ul className="mx-auto flex max-w-lg">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-zumrut-700" : "text-kum-500",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Masaüstü: sol sütun. */
export function PanelNavDesktop() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:block" aria-label="Panel menüsü">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-zumrut-50 text-zumrut-800"
                    : "text-kum-600 hover:bg-kum-100 hover:text-kum-900",
                )}
              >
                <item.icon className="size-4.5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
