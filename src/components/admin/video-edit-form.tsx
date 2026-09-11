"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import {
  GradeFolderPicker,
  type SinifKlasorleri,
} from "@/components/admin/grade-folder-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { updateVideoAction } from "@/modules/video/actions";

export function VideoEditForm({
  videoId,
  title,
  description,
  grades,
  isActive,
  foldersByGrade,
  selectedFolders,
}: {
  videoId: string;
  title: string;
  description: string | null;
  grades: number[];
  isActive: boolean;
  foldersByGrade: SinifKlasorleri;
  selectedFolders: Record<number, string | null>;
}) {
  const [state, formAction] = useActionState(updateVideoAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  /*
   * Kayıt başarılı olunca sunucu verisini tazele.
   *
   * revalidatePath tek başına yetmiyor: açık duran sayfa istemci
   * yönlendiricisinin önbelleğinden gelmeye devam ediyor ve "Video güncellendi"
   * yazmasına rağmen ekranda eski değerler kalıyordu.
   */
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="videoId" value={videoId} />
      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" name="title" defaultValue={title} required />
      </Field>

      <Field>
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={description ?? ""}
        />
      </Field>

      <GradeFolderPicker
        foldersByGrade={foldersByGrade}
        selected={grades}
        selectedFolders={selectedFolders}
      />

      <label className="flex items-center gap-2.5 text-sm text-kum-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={isActive}
          className="size-4 accent-zumrut-700"
        />
        Yayında (kapatırsanız öğrenciler göremez)
      </label>

      <SubmitButton pendingLabel="Kaydediliyor…">Kaydet</SubmitButton>
    </form>
  );
}
