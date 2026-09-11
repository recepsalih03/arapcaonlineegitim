"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { voteAction } from "@/modules/surveys/actions";

/**
 * Anket oylama formu. Öğrenciye sonuç GÖSTERİLMEZ — sonuçları yalnızca admin
 * görür (PROJE.md §7). Oy anonimdir; kimin ne oyladığı kaydedilmez.
 */
export function VoteForm({
  surveyId,
  options,
}: {
  surveyId: string;
  options: string[];
}) {
  const [state, formAction] = useActionState(voteAction, EMPTY_ACTION_STATE);

  if (state.success) {
    return <ActionFeedback state={state} />;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="surveyId" value={surveyId} />
      <ActionFeedback state={state} />

      <fieldset className="space-y-2">
        <legend className="sr-only">Seçenekler</legend>
        {options.map((option, index) => (
          <label
            key={index}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-kum-200 bg-white px-3.5 py-3 text-[15px] text-kum-700 transition-colors has-checked:border-zumrut-500 has-checked:bg-zumrut-50 has-checked:text-zumrut-900"
          >
            <input
              type="radio"
              name="optionIndex"
              value={index}
              required
              className="size-4 accent-zumrut-700"
            />
            {option}
          </label>
        ))}
      </fieldset>

      <SubmitButton pendingLabel="Gönderiliyor…">Oy ver</SubmitButton>
      <p className="text-xs text-kum-400">
        Oyunuz anonimdir; hangi seçeneği işaretlediğiniz kaydedilmez.
      </p>
    </form>
  );
}
