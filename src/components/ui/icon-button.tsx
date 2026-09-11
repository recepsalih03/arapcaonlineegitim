"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Tablo satırlarındaki dar işlem butonu: yalnızca ikon, metin ipucu title/aria
 * ile verilir. Dokunmatik hedef 44px'in altına düşmesin diye p-2.5 + size-5.
 */
export function IconSubmitButton({
  icon: Icon,
  label,
  tone = "notr",
  className,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "notr" | "tehlike";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg border transition-colors disabled:opacity-50",
        tone === "tehlike"
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-kum-200 text-kum-600 hover:bg-kum-100 hover:text-kum-900",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Icon className="size-4" aria-hidden />
      )}
    </button>
  );
}

