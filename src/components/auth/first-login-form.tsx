"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FieldHint, Input, Label } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { completeFirstLoginAction } from "@/modules/auth/actions";
import { PASSWORD_MIN_LENGTH, USERNAME_MIN_LENGTH } from "@/modules/auth/rules";

/** Zorunlu ilk giriş: kullanıcı adı ve şifre birlikte değiştirilir (PROJE.md §4b). */
export function FirstLoginForm() {
  const [state, formAction] = useActionState(
    completeFirstLoginAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="username">Yeni kullanıcı adı</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          minLength={USERNAME_MIN_LENGTH}
          required
        />
        <FieldHint>
          Küçük harf, rakam, nokta, tire ve alt çizgi kullanabilirsiniz. Türkçe
          karakter ve boşluk olmaz.
        </FieldHint>
      </Field>

      <Field>
        <Label htmlFor="password">Yeni şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />
        <FieldHint>En az {PASSWORD_MIN_LENGTH} karakter.</FieldHint>
      </Field>

      <Field>
        <Label htmlFor="passwordConfirm">Yeni şifre (tekrar)</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />
      </Field>

      <SubmitButton block size="lg" pendingLabel="Kaydediliyor…">
        Kaydet ve devam et
      </SubmitButton>
    </form>
  );
}
