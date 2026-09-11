import * as React from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-dashed border-kum-300 bg-white/60 px-5 py-10 text-center",
        className,
      )}
    >
      <p className="font-medium text-kum-700">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-kum-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
