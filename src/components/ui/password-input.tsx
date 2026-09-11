"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Göz ikonuyla içeriği gösterilebilen şifre alanı.
 * Telefonda uzun şifreyi görmeden yazmak hataya çok açık.
 */
export function PasswordInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const [gorunur, setGorunur] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={gorunur ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setGorunur((g) => !g)}
        aria-label={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
        aria-pressed={gorunur}
        // Tab sırasını bozmasın: alan → buton değil, alan → sonraki alan.
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-kum-400 transition-colors hover:text-kum-700"
      >
        {gorunur ? (
          <EyeOff className="size-5" aria-hidden />
        ) : (
          <Eye className="size-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
