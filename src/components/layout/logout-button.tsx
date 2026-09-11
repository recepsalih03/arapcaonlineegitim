import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/modules/auth/actions";

export function LogoutButton({
  className,
  variant = "ghost",
  label = "Çıkış",
}: {
  className?: string;
  variant?: "ghost" | "secondary";
  label?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant} size="sm" className={cn(className)}>
        <LogOut className="size-4" aria-hidden />
        {label}
      </Button>
    </form>
  );
}
