"use client";

import { useActionState } from "react";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";
import { EMPTY_ACTION_STATE, type ActionState } from "@/lib/forms";

type Action = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Tek butonluk, onay soran form. Silme/pasife alma gibi geri dönüşü olan ama
 * yanlışlıkla tetiklenmemesi gereken işlemler için.
 */
export function ConfirmForm({
  action,
  fields,
  confirmMessage,
  children,
  variant = "danger",
  size = "sm",
  showFeedback = true,
  pendingLabel,
  ikon,
  ikonEtiketi,
}: {
  action: Action;
  fields: Record<string, string | number>;
  confirmMessage?: string;
  /** İkon modunda gerekmez. */
  children?: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  showFeedback?: boolean;
  pendingLabel?: string;
  /**
   * Verilirse metin yerine dar ikon düğme çizilir (tablo satırları için).
   *
   * Bileşen değil HAZIR ELEMENT beklenir (`<Trash2 />`): bu bileşen istemci
   * tarafında çalışıyor ve sunucudan fonksiyon geçirilemiyor — element ise
   * sorunsuz geçiyor.
   */
  ikon?: React.ReactNode;
  ikonEtiketi?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_ACTION_STATE);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className="contents"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
      {ikon ? (
        <IkonGonder
          ikon={ikon}
          etiket={ikonEtiketi ?? "Sil"}
          tehlike={variant === "danger"}
        />
      ) : (
        <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel}>
          {children}
        </SubmitButton>
      )}
      {showFeedback && (state.error || state.success) ? (
        <div className="w-full">
          <ActionFeedback state={state} />
        </div>
      ) : null}
    </form>
  );
}

/** ConfirmForm'un ikon modundaki gönder düğmesi. */
function IkonGonder({
  ikon,
  etiket,
  tehlike,
}: {
  ikon: React.ReactNode;
  etiket: string;
  tehlike: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={etiket}
      aria-label={etiket}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border transition-colors disabled:opacity-50",
        tehlike
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-kum-200 text-kum-600 hover:bg-kum-100 hover:text-kum-900",
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : ikon}
    </button>
  );
}
