import * as React from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-sm font-medium text-kum-700", className)}
      {...props}
    />
  );
}

const controlClasses =
  "w-full rounded-xl border border-kum-200 bg-white px-3 text-[16px] text-kum-900 " +
  "placeholder:text-kum-400 focus:border-zumrut-500 focus:outline-2 focus:outline-offset-0 " +
  "focus:outline-zumrut-200 disabled:bg-kum-100 disabled:text-kum-500";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  // 16px yazı boyutu bilinçli: iOS Safari daha küçük fontlarda alana
  // odaklanınca sayfayı otomatik yakınlaştırıyor.
  return <input className={cn(controlClasses, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlClasses, "py-2.5 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(controlClasses, "h-11 pr-8", className)} {...props} />
  );
}

export function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs text-kum-500", className)} {...props} />;
}

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}
