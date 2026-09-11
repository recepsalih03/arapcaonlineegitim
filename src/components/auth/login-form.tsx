"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { signInAction } from "@/modules/auth/actions";
import {
  cihazKimligiHemen,
  useFingerprint,
} from "@/modules/devices/use-fingerprint";

/** Giriş formu. Cihaz parmak izi gizli alanla birlikte gönderilir. */
export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useActionState(signInAction, EMPTY_ACTION_STATE);
  const { fingerprint } = useFingerprint();

  /*
   * Cihaz kimliği hazır değilse gönderim ANINDA üretilir.
   * Buton hiçbir koşulda kilitlenmez: cihaz limiti yardımcı bir özellik,
   * girişin şartı değil. Eski sürümde parmak izi takılınca öğrenci hiç
   * giriş yapamıyordu.
   */
  function gonder(formData: FormData) {
    if (!formData.get("fingerprint")) {
      formData.set("fingerprint", cihazKimligiHemen());
    }
    formAction(formData);
  }

  return (
    <form action={gonder} className="space-y-4">
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="username">Kullanıcı adı</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="ogr7-3fk2a1"
        />
      </Field>

      <Field>
        <Label htmlFor="password">Şifre</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-kum-700">
        <input
          type="checkbox"
          name="rememberMe"
          value="true"
          defaultChecked
          className="size-4 accent-zumrut-700"
        />
        Beni hatırla
      </label>

      <input type="hidden" name="fingerprint" value={fingerprint ?? ""} />

      <SubmitButton block size="lg" pendingLabel="Giriş yapılıyor…">
        Giriş yap
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-kum-500">
        Kullanıcı adı ve şifreniz öğretmeniniz tarafından verilir. İlk girişte
        ikisini de kendiniz belirleyeceksiniz. Ortak bir cihazdaysanız
        &quot;Beni hatırla&quot; seçeneğini kaldırın.
      </p>
    </form>
  );
}
