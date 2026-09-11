import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const TONE = {
  info: {
    box: "border-zumrut-200 bg-zumrut-50 text-zumrut-900",
    icon: Info,
  },
  success: {
    box: "border-zumrut-300 bg-zumrut-50 text-zumrut-900",
    icon: CheckCircle2,
  },
  warning: {
    box: "border-altin-300 bg-altin-50 text-altin-700",
    icon: AlertTriangle,
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: AlertTriangle,
  },
} as const;

export function Alert({
  tone = "info",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: keyof typeof TONE }) {
  const { box, icon: Icon } = TONE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        box,
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
