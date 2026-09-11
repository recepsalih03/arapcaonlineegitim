"use client";

import {
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MonitorPlay,
  Users,
  Vote,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { GRADES, gradeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/yonetim", label: "Genel bakış", icon: LayoutDashboard, exact: true },
  { href: "/yonetim/ogrenciler", label: "Öğrenciler", icon: Users },
  { href: "/yonetim/videolar", label: "Videolar", icon: MonitorPlay },
  { href: "/yonetim/duyurular", label: "Duyurular", icon: Megaphone },
  { href: "/yonetim/anketler", label: "Anketler", icon: Vote },
  { href: "/yonetim/oyunlar", label: "Oyunlar", icon: Gamepad2 },
];

function linkClasses(active: boolean) {
  return cn(
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-zumrut-50 text-zumrut-800"
      : "text-kum-600 hover:bg-kum-100 hover:text-kum-900",
  );
}

/**
 * Yönetim menüsü: bölümler + her sınıf için ayrı panel (PROJE.md §7).
 * Mobilde yatay kaydırılabilir şerit, masaüstünde sol sütun.
 */
export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobil: yatay şerit */}
      <div className="-mx-4 overflow-x-auto border-b border-kum-200 bg-white px-4 md:hidden">
        <nav className="flex w-max gap-1 py-2" aria-label="Yönetim menüsü">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                isActive(section.href, section.exact)
                  ? "bg-zumrut-50 text-zumrut-800"
                  : "text-kum-600",
              )}
            >
              {section.label}
            </Link>
          ))}
          {GRADES.map((grade) => (
            <Link
              key={grade}
              href={`/yonetim/sinif/${grade}`}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                isActive(`/yonetim/sinif/${grade}`)
                  ? "bg-zumrut-50 text-zumrut-800"
                  : "text-kum-600",
              )}
            >
              {grade}. Sınıf
            </Link>
          ))}
        </nav>
      </div>

      {/* Masaüstü: sol sütun */}
      <nav className="hidden md:block" aria-label="Yönetim menüsü">
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className={linkClasses(isActive(section.href, section.exact))}
              >
                <section.icon className="size-4.5" aria-hidden />
                {section.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-kum-400">
          Sınıf panelleri
        </p>
        <ul className="mt-2 space-y-1">
          {GRADES.map((grade) => (
            <li key={grade}>
              <Link
                href={`/yonetim/sinif/${grade}`}
                className={linkClasses(isActive(`/yonetim/sinif/${grade}`))}
              >
                <GraduationCap className="size-4.5" aria-hidden />
                {gradeLabel(grade)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
