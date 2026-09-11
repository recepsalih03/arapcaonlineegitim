"use client";

import { ChevronDown, ChevronUp, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { IconSubmitButton } from "@/components/ui/icon-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE, type ActionState } from "@/lib/forms";
import {
  createFolderAction,
  deleteFolderAction,
  moveFolderAction,
  renameFolderAction,
} from "@/modules/video/folder-actions";

export type KlasorSatiri = { id: string; name: string; videoCount: number };

/**
 * Bir SINIFIN video klasörlerini yönetir: oluşturma, adlandırma, sıralama, silme.
 * Klasörler sınıfa özel olduğu için bileşen sınıfı bilmek zorunda.
 */
export function FolderManager({
  folders,
  grade,
}: {
  folders: KlasorSatiri[];
  grade: number;
}) {
  const [ekleState, ekleAction] = useActionState(
    createFolderAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <form action={ekleAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="gradeLevel" value={grade} />
        <div className="min-w-[12rem] flex-1">
          <Input
            name="name"
            placeholder="Yeni klasör adı (ör. 1. Ünite)"
            required
            minLength={2}
            maxLength={60}
            aria-label="Yeni klasör adı"
          />
        </div>
        <SubmitButton variant="secondary" pendingLabel="Ekleniyor…">
          <FolderPlus className="size-4" aria-hidden />
          Ekle
        </SubmitButton>
      </form>

      <ActionFeedback state={ekleState} />

      {folders.length === 0 ? (
        <p className="text-sm text-kum-500">
          Henüz klasör yok. Klasörsüz videolar öğrenciye &quot;Diğer&quot;
          başlığı altında görünür.
        </p>
      ) : (
        <ul className="divide-y divide-kum-100 rounded-card border border-kum-200 bg-white">
          {folders.map((folder, index) => (
            <KlasorSatir
              key={folder.id}
              folder={folder}
              grade={grade}
              ilk={index === 0}
              son={index === folders.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function KlasorSatir({
  folder,
  grade,
  ilk,
  son,
}: {
  folder: KlasorSatiri;
  grade: number;
  ilk: boolean;
  son: boolean;
}) {
  const [duzenle, setDuzenle] = useState(false);
  const [adState, adAction] = useActionState(
    renameFolderAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <li className="flex flex-wrap items-center gap-2 px-3 py-2.5">
      {duzenle ? (
        <form
          action={adAction}
          onSubmit={() => setDuzenle(false)}
          className="flex flex-1 flex-wrap items-center gap-2"
        >
          <input type="hidden" name="folderId" value={folder.id} />
          <input type="hidden" name="gradeLevel" value={grade} />
          <Input
            name="name"
            defaultValue={folder.name}
            required
            minLength={2}
            maxLength={60}
            autoFocus
            className="min-w-[10rem] flex-1"
            aria-label="Klasör adı"
          />
          <SubmitButton size="sm" pendingLabel="…">
            Kaydet
          </SubmitButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDuzenle(false)}
          >
            Vazgeç
          </Button>
        </form>
      ) : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-kum-900">
              {folder.name}
            </span>
            <span className="text-xs text-kum-400">
              {folder.videoCount} video
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            <SiraForm folderId={folder.id} grade={grade} yon="yukari" pasif={ilk} />
            <SiraForm folderId={folder.id} grade={grade} yon="asagi" pasif={son} />

            <button
              type="button"
              onClick={() => setDuzenle(true)}
              title="Adını değiştir"
              aria-label={`${folder.name} adını değiştir`}
              className="grid size-9 place-items-center rounded-lg border border-kum-200 text-kum-600 transition-colors hover:bg-kum-100"
            >
              <Pencil className="size-4" aria-hidden />
            </button>

            <SilForm folder={folder} grade={grade} />
          </div>
        </>
      )}

      {adState.error ? (
        <div className="w-full">
          <ActionFeedback state={adState} />
        </div>
      ) : null}
    </li>
  );
}

function SiraForm({
  folderId,
  grade,
  yon,
  pasif,
}: {
  folderId: string;
  grade: number;
  yon: "yukari" | "asagi";
  pasif: boolean;
}) {
  const [, formAction] = useActionState(moveFolderAction, EMPTY_ACTION_STATE);

  if (pasif) {
    return <span className="size-9" aria-hidden />;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="folderId" value={folderId} />
      <input type="hidden" name="gradeLevel" value={grade} />
      <input type="hidden" name="yon" value={yon} />
      <IconSubmitButton
        icon={yon === "yukari" ? ChevronUp : ChevronDown}
        label={yon === "yukari" ? "Yukarı taşı" : "Aşağı taşı"}
      />
    </form>
  );
}

function SilForm({
  folder,
  grade,
}: {
  folder: KlasorSatiri;
  grade: number;
}) {
  const [, formAction] = useActionState(
    deleteFolderAction as (
      prev: ActionState,
      fd: FormData,
    ) => Promise<ActionState>,
    EMPTY_ACTION_STATE,
  );

  return (
    <form
      action={formAction}
      onSubmit={(olay) => {
        const mesaj =
          folder.videoCount > 0
            ? `"${folder.name}" klasörü silinsin mi? İçindeki ${folder.videoCount} video SİLİNMEZ, klasörsüz kalır.`
            : `"${folder.name}" klasörü silinsin mi?`;
        if (!window.confirm(mesaj)) olay.preventDefault();
      }}
    >
      <input type="hidden" name="folderId" value={folder.id} />
      <input type="hidden" name="gradeLevel" value={grade} />
      <IconSubmitButton icon={Trash2} label="Klasörü sil" tone="tehlike" />
    </form>
  );
}
