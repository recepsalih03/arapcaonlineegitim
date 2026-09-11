"use client";

import { KeyRound, Power, Smartphone, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { CopyField } from "@/components/admin/copy-field";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { IconSubmitButton } from "@/components/ui/icon-button";
import { EMPTY_ACTION_STATE, type ActionState } from "@/lib/forms";
import {
  deleteStudentAction,
  resetStudentDevicesAction,
  resetStudentPasswordAction,
  setStudentActiveAction,
} from "@/modules/students/actions";

/**
 * Öğrenci satırındaki işlemler — tablo hücresine sığsın diye ikon butonlar.
 * Geri dönüşü olmayan işlemler (silme, pasife alma) onay ister.
 */
export function StudentActions({
  studentId,
  gradeLevel,
  isActive,
  studentLabel,
}: {
  studentId: string;
  gradeLevel: number | null;
  isActive: boolean;
  studentLabel: string;
}) {
  const [sifreState, sifreAction] = useActionState(
    resetStudentPasswordAction,
    EMPTY_ACTION_STATE,
  );

  const gizliAlanlar = (
    <>
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="gradeLevel" value={gradeLevel ?? ""} />
    </>
  );

  function onayla(mesaj: string) {
    return (olay: React.FormEvent) => {
      if (!window.confirm(mesaj)) olay.preventDefault();
    };
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <SessizForm
          action={setStudentActiveAction}
          onSubmit={
            isActive
              ? onayla(
                  `${studentLabel} pasife alınsın mı? Giriş yapamaz ve açık oturumları kapanır.`,
                )
              : undefined
          }
        >
          {gizliAlanlar}
          <input type="hidden" name="isActive" value={String(!isActive)} />
          <IconSubmitButton
            icon={Power}
            label={isActive ? "Pasife al" : "Aktif et"}
          />
        </SessizForm>

        <form action={sifreAction}>
          {gizliAlanlar}
          <IconSubmitButton icon={KeyRound} label="Yeni geçici şifre ver" />
        </form>

        <SessizForm
          action={resetStudentDevicesAction}
          onSubmit={onayla(
            `${studentLabel} için kayıtlı tüm cihazlar silinsin mi? Öğrenci yeniden giriş yapmak zorunda kalır.`,
          )}
        >
          {gizliAlanlar}
          <IconSubmitButton icon={Smartphone} label="Cihazları sıfırla" />
        </SessizForm>

        <SessizForm
          action={deleteStudentAction}
          onSubmit={onayla(
            `${studentLabel} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
          )}
        >
          {gizliAlanlar}
          <IconSubmitButton icon={Trash2} label="Öğrenciyi sil" tone="tehlike" />
        </SessizForm>
      </div>

      <ActionFeedback state={sifreState} />
      {sifreState.data?.password ? (
        <CopyField label="Yeni geçici şifre" value={sifreState.data.password} />
      ) : null}
    </div>
  );
}

/** Sonucu ekrana basmayan, yalnızca işi yapan form. */
function SessizForm({
  action,
  onSubmit,
  children,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onSubmit?: (olay: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  const [, formAction] = useActionState(action, EMPTY_ACTION_STATE);
  return (
    <form action={formAction} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
