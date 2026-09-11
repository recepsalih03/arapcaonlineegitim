import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Yönetim listeleri için tablo.
 *
 * Dar ekranda tablo daraltılmaz, YATAY KAYDIRILIR: sütunları alt alta
 * yığmak satır sayısı arttıkça okunmaz hâle geliyor, kaydırma ise sütun
 * hizasını koruyor.
 */
export function TableWrap({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "-mx-4 overflow-x-auto border-y border-kum-200 bg-white sm:mx-0 sm:rounded-card sm:border",
        className,
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full min-w-[36rem] border-collapse text-sm", className)}
      {...props}
    />
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-kum-200 bg-kum-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-kum-500",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-kum-100 px-3 py-2.5 align-middle", className)}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-kum-50/60", className)} {...props} />;
}
