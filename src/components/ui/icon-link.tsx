import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Tablo satırlarında bağlantı için dar ikon düğme.
 *
 * Bilerek "use client" YOK: hook kullanmıyor ve sunucu bileşenlerinden
 * çağrılıyor. İstemci bileşeni olsaydı `icon` prop'u (bir React bileşeni,
 * yani fonksiyon) sunucudan istemciye geçemez, sayfa çökerdi.
 */
export function IconLinkButton({
  href,
  icon: Icon,
  label,
  className,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border border-kum-200 text-kum-600 transition-colors hover:bg-kum-100 hover:text-kum-900",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </Link>
  );
}
