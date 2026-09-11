import * as React from "react";

import { cn } from "@/lib/utils";

const TONES = {
  yesil: "bg-zumrut-100 text-zumrut-800 border-zumrut-200",
  altin: "bg-altin-100 text-altin-700 border-altin-200",
  notr: "bg-kum-100 text-kum-600 border-kum-200",
  kirmizi: "bg-red-50 text-red-700 border-red-200",
} as const;

export function Badge({
  tone = "notr",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof TONES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
