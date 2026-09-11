"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, FieldHint, Input, Label, Textarea } from "@/components/ui/field";
import { toDateTimeLocal } from "@/lib/forms";
import { GradePicker } from "@/components/ui/grade-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/modules/announcements/actions";

/** Duyuru oluşturma/düzenleme (PROJE.md §7 "Duyuru paneli"). */
export function AnnouncementForm({
  announcement,
  fixedGrade,
}: {
  announcement?: {
    id: string;
    title: string;
    body: string;
    grades: number[];
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  };
  fixedGrade?: number;
}) {
  const editing = Boolean(announcement);
  const [state, formAction] = useActionState(
    editing ? updateAnnouncementAction : createAnnouncementAction,
    EMPTY_ACTION_STATE,
  );
  const router = useRouter();

  // Kaydettikten sonra sunucu verisini tazele: revalidatePath tek başına
  // açık duran sayfayı güncellemiyor, ekranda eski değerler kalıyordu.
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4" key={state.success ?? "form"}>
      {announcement ? (
        <input type="hidden" name="announcementId" value={announcement.id} />
      ) : null}

      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="title">Başlık</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={announcement?.title}
          placeholder="Bu haftanın ödevi"
        />
      </Field>

      <Field>
        <Label htmlFor="body">Duyuru metni</Label>
        <Textarea
          id="body"
          name="body"
          rows={5}
          required
          defaultValue={announcement?.body}
        />
      </Field>

      <Field>
        <Label>Hangi sınıflara gitsin?</Label>
        <GradePicker
          selected={announcement?.grades ?? (fixedGrade ? [fixedGrade] : [])}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="startsAt">Başlangıç</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toDateTimeLocal(announcement?.startsAt)}
          />
        </Field>
        <Field>
          <Label htmlFor="endsAt">Bitiş</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={toDateTimeLocal(announcement?.endsAt)}
          />
        </Field>
      </div>
      <FieldHint>
        Boş bırakırsanız duyuru hemen yayınlanır ve süresiz kalır. Saatler
        Türkiye saatidir.
      </FieldHint>

      {editing ? (
        <label className="flex items-center gap-2.5 text-sm text-kum-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={announcement?.isActive}
            className="size-4 accent-zumrut-700"
          />
          Yayında
        </label>
      ) : null}

      <SubmitButton pendingLabel="Kaydediliyor…">
        {editing ? "Kaydet" : "Duyuruyu yayınla"}
      </SubmitButton>
    </form>
  );
}
