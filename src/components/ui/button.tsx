import { Slot } from "@/components/ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Buton. Mobil öncelikli: varsayılan yükseklik 44px (dokunmatik hedef),
 * masaüstünde de aynı kalır — tutarlılık sadelikten daha önemli değil ama
 * ayrı bir boy setini gerektirecek kadar da farklı değil.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zumrut-600 " +
    "disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-zumrut-700 text-white hover:bg-zumrut-800 active:bg-zumrut-900 shadow-sm",
        secondary:
          "bg-white text-zumrut-800 border border-kum-200 hover:bg-kum-100 active:bg-kum-200",
        altin:
          "bg-altin-300 text-kum-900 hover:bg-altin-400 active:bg-altin-500 shadow-sm",
        ghost: "text-kum-700 hover:bg-kum-100 active:bg-kum-200",
        danger:
          "bg-white text-red-700 border border-red-200 hover:bg-red-50 active:bg-red-100",
        // Oyun modülü için: sitenin sakin yeşili canlı palette yabancı kalıyor.
        oyun:
          "text-white shadow-md bg-[linear-gradient(135deg,var(--color-oyun-zumrut),var(--color-oyun-firuze))] " +
          "hover:brightness-110 hover:shadow-lg active:brightness-95 focus-visible:outline-oyun-firuze",
      },
      size: {
        sm: "h-9 px-3 text-[13px]",
        md: "h-11 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
