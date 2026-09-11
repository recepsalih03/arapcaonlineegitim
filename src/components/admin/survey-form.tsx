"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Field, FieldHint, Input, Label } from "@/components/ui/field";
import { GradePicker } from "@/components/ui/grade-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { createSurveyAction, updateSurveyAction } from "@/modules/surveys/actions";

const MAX_OPTIONS = 8;

/**
 * Anket oluşturma (PROJE.md §7 "Anket paneli").
 * Düzenlemede seçenekler değiştirilemez: mevcut oylar seçenek sırasına bağlı,
 * sıra değişirse geçmiş oylar yanlış seçeneğe yazılmış olurdu.
 */
export function SurveyForm({
  survey,
  fixedGrade,
}: {
  survey?: {
    id: string;
    question: string;
    options: string[];
    grades: number[];
    isActive: boolean;
  };
  fixedGrade?: number;
}) {
  const editing = Boolean(survey);
  const [state, formAction] = useActionState(
    editing ? updateSurveyAction : createSurveyAction,
    EMPTY_ACTION_STATE,
  );
  const router = useRouter();

  // Kaydettikten sonra sunucu verisini tazele: revalidatePath tek başına
  // açık duran sayfayı güncellemiyor, ekranda eski değerler kalıyordu.
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);
  const [optionCount, setOptionCount] = useState(2);

  return (
    <form action={formAction} className="space-y-4">
      {survey ? <input type="hidden" name="surveyId" value={survey.id} /> : null}

      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="question">Soru</Label>
        <Input
          id="question"
          name="question"
          required
          defaultValue={survey?.question}
          placeholder="Derslerin saati sizin için uygun mu?"
        />
      </Field>

      {editing ? (
        <Field>
          <Label>Seçenekler</Label>
          <ul className="space-y-1.5">
            {survey?.options.map((option, index) => (
              <li
                key={index}
                className="rounded-xl border border-kum-200 bg-kum-50 px-3 py-2 text-sm text-kum-600"
              >
                {option}
              </li>
            ))}
          </ul>
          <FieldHint>
            Seçenekler sonradan değiştirilemez; farklı seçenekler için yeni
            anket oluşturun.
          </FieldHint>
        </Field>
      ) : (
        <Field>
          <Label>Seçenekler</Label>
          <div className="space-y-2">
            {Array.from({ length: optionCount }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  name="options"
                  required
                  placeholder={`${index + 1}. seçenek`}
                  aria-label={`${index + 1}. seçenek`}
                />
                {optionCount > 2 && index === optionCount - 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Son seçeneği kaldır"
                    onClick={() => setOptionCount((count) => count - 1)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          {optionCount < MAX_OPTIONS ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOptionCount((count) => count + 1)}
            >
              <Plus className="size-4" aria-hidden />
              Seçenek ekle
            </Button>
          ) : null}
        </Field>
      )}

      <Field>
        <Label>Hangi sınıflara gitsin?</Label>
        <GradePicker selected={survey?.grades ?? (fixedGrade ? [fixedGrade] : [])} />
      </Field>

      {editing ? (
        <label className="flex items-center gap-2.5 text-sm text-kum-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={survey?.isActive}
            className="size-4 accent-zumrut-700"
          />
          Açık (kapatırsanız yeni oy verilemez)
        </label>
      ) : (
        <p className="text-sm text-kum-500">
          Anket anonimdir; sonuçları yalnızca siz görürsünüz.
        </p>
      )}

      <SubmitButton pendingLabel="Kaydediliyor…">
        {editing ? "Kaydet" : "Anketi yayınla"}
      </SubmitButton>
    </form>
  );
}
