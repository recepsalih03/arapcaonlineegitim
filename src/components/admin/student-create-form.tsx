"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";

import { CopyField } from "@/components/admin/copy-field";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { GRADES, gradeLabel } from "@/lib/constants";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { createStudentAction } from "@/modules/students/actions";

/**
 * "Yeni Öğrenci Oluştur" (PROJE.md §4a).
 * Sistem geçici kullanıcı adı ve şifre üretir; admin bunları öğrenciye iletir.
 */
export function StudentCreateForm({ fixedGrade }: { fixedGrade?: number }) {
  const [state, formAction] = useActionState(
    createStudentAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <ActionFeedback state={state} />

        {fixedGrade ? (
          <input type="hidden" name="gradeLevel" value={fixedGrade} />
        ) : (
          <Field>
            <Label htmlFor="gradeLevel">Sınıf seviyesi</Label>
            <Select id="gradeLevel" name="gradeLevel" required defaultValue="">
              <option value="" disabled>
                Seçin
              </option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {gradeLabel(grade)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field>
          <Label htmlFor="fullName">Öğrencinin adı (isteğe bağlı)</Label>
          <Input id="fullName" name="fullName" placeholder="Ahmet Yılmaz" />
        </Field>

        <SubmitButton pendingLabel="Oluşturuluyor…">
          <UserPlus className="size-4" aria-hidden />
          Yeni öğrenci oluştur
        </SubmitButton>
      </form>

      {state.data?.username ? (
        <div className="space-y-2 rounded-card border border-altin-300 bg-altin-50 p-4">
          <p className="text-sm font-medium text-altin-700">
            Bu bilgileri öğrenciye iletin.
          </p>
          <CopyField label="Kullanıcı adı" value={state.data.username} />
          <CopyField label="Geçici şifre" value={state.data.password} />
        </div>
      ) : null}
    </div>
  );
}
