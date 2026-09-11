"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FieldHint, Input, Label } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { updateCredentialsAction } from "@/modules/auth/actions";
import { PASSWORD_MIN_LENGTH } from "@/modules/auth/rules";

/**
 * Hesap ayarlarından kullanıcı adı/şifre değişimi (PROJE.md §4c).
 * Her iki alan da mevcut şifre doğrulanmadan değişmez.
 */
export function CredentialsForm({ currentUsername }: { currentUsername: string }) {
  const [state, formAction] = useActionState(
    updateCredentialsAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="currentPassword">Mevcut şifreniz</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldHint>Değişiklik yapabilmek için gereklidir.</FieldHint>
      </Field>

      <hr className="border-kum-200" />

      <Field>
        <Label htmlFor="username">Yeni kullanıcı adı</Label>
        <Input
          id="username"
          name="username"
          defaultValue={currentUsername}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <FieldHint>
          Kullanıcı adınızı değiştirirseniz güvenlik için yeniden giriş yapmanız
          istenir.
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
          placeholder="Değiştirmek istemiyorsanız boş bırakın"
        />
      </Field>

      <Field>
        <Label htmlFor="passwordConfirm">Yeni şifre (tekrar)</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
        />
      </Field>

      <SubmitButton pendingLabel="Kaydediliyor…">Kaydet</SubmitButton>
    </form>
  );
}
