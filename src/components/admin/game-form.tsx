"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldHint, Input, Label, Textarea } from "@/components/ui/field";
import { GradePicker } from "@/components/ui/grade-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { createGameAction, updateGameAction } from "@/modules/game/actions";
import { OYUN_TURLERI, type OyunTuru } from "@/modules/game/types";

export type OyunFormVerisi = {
  id: string;
  title: string;
  description: string | null;
  type: OyunTuru;
  isArabic: boolean;
  isActive: boolean;
  grades: number[];
  metin?: string;
  ciftler?: Array<{ soru: string; cevap: string }>;
};

/** Oyun oluşturma / düzenleme formu. Editör alanı türe göre değişir. */
export function GameForm({
  type,
  game,
}: {
  type: OyunTuru;
  game?: OyunFormVerisi;
}) {
  const duzenleme = Boolean(game);
  const [state, formAction] = useActionState(
    duzenleme ? updateGameAction : createGameAction,
    EMPTY_ACTION_STATE,
  );
  const router = useRouter();

  // Kaydettikten sonra sunucu verisini tazele: revalidatePath tek başına
  // açık duran sayfayı güncellemiyor, ekranda eski değerler kalıyordu.
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);
  const tur = OYUN_TURLERI[type];

  return (
    <form action={formAction} className="space-y-5">
      {game ? <input type="hidden" name="gameId" value={game.id} /> : null}
      <input type="hidden" name="type" value={type} />

      <ActionFeedback state={state} />

      <Field>
        <Label htmlFor="title">Oyun adı</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={game?.title}
          placeholder={tur.ornekAd}
        />
      </Field>

      <Field>
        <Label htmlFor="description">Açıklama (isteğe bağlı)</Label>
        <Input id="description" name="description" defaultValue={game?.description ?? ""} />
      </Field>

      <Field>
        <Label>Hangi sınıflar oynayacak?</Label>
        <GradePicker selected={game?.grades ?? []} />
      </Field>

      {type === "BOSLUK" ? (
        <BoslukEditoru metin={game?.metin ?? ""} />
      ) : (
        <CiftEditoru type={type} ciftler={game?.ciftler ?? []} />
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-kum-700">
        <input
          type="checkbox"
          name="isArabic"
          defaultChecked={game?.isArabic ?? false}
          className="size-4 accent-zumrut-700"
        />
        İçerik Arapça (sağdan sola gösterilsin)
      </label>

      {duzenleme ? (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-kum-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={game?.isActive}
            className="size-4 accent-zumrut-700"
          />
          Yayında
        </label>
      ) : null}

      <SubmitButton size="lg" pendingLabel="Kaydediliyor…">
        {duzenleme ? "Kaydet" : "Oyunu oluştur"}
      </SubmitButton>
    </form>
  );
}

function BoslukEditoru({ metin }: { metin: string }) {
  const [deger, setDeger] = useState(metin);
  const sayi = (deger.match(/\[[^\][\n]{1,60}\]/g) ?? []).length;

  return (
    <Field>
      <Label htmlFor="metin">Metin</Label>
      <Textarea
        id="metin"
        name="metin"
        rows={7}
        required
        value={deger}
        onChange={(o) => setDeger(o.target.value)}
        placeholder="Bu [kitap] çok güzel. Ahmet her gün [okula] gider."
      />
      <FieldHint>
        Gizlemek istediğiniz kelimeyi <strong>köşeli parantez</strong> içine alın.
        Öğrenci o kelimeyi yazacak.
      </FieldHint>
      {sayi > 0 ? (
        <p className="text-sm font-medium text-zumrut-700">{sayi} boşluk</p>
      ) : (
        <Alert tone="warning">
          Henüz boşluk yok. En az bir kelimeyi [köşeli parantez] içine alın.
        </Alert>
      )}
    </Field>
  );
}

function CiftEditoru({
  type,
  ciftler,
}: {
  type: OyunTuru;
  ciftler: Array<{ soru: string; cevap: string }>;
}) {
  const tur = OYUN_TURLERI[type];
  const [satirlar, setSatirlar] = useState(
    ciftler.length > 0 ? ciftler : [{ soru: "", cevap: "" }, { soru: "", cevap: "" }],
  );

  function degistir(i: number, alan: "soru" | "cevap", deger: string) {
    setSatirlar((o) => o.map((s, j) => (j === i ? { ...s, [alan]: deger } : s)));
  }

  return (
    <Field>
      <Label>{tur.editorBasligi}</Label>

      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_1fr_2.5rem] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-kum-500 sm:grid">
          <span>{tur.soruEtiketi}</span>
          <span>{tur.cevapEtiketi}</span>
          <span />
        </div>

        {satirlar.map((satir, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2.5rem] gap-2">
            <Input
              name="cift-soru"
              value={satir.soru}
              onChange={(o) => degistir(i, "soru", o.target.value)}
              placeholder={tur.soruEtiketi}
              aria-label={`${i + 1}. satır ${tur.soruEtiketi}`}
            />
            <Input
              name="cift-cevap"
              value={satir.cevap}
              onChange={(o) => degistir(i, "cevap", o.target.value)}
              placeholder={tur.cevapEtiketi}
              aria-label={`${i + 1}. satır ${tur.cevapEtiketi}`}
            />
            <button
              type="button"
              onClick={() => setSatirlar((o) => o.filter((_, j) => j !== i))}
              disabled={satirlar.length <= 2}
              aria-label={`${i + 1}. satırı sil`}
              className="grid size-11 place-items-center rounded-lg text-kum-400 transition-colors hover:bg-kum-100 hover:text-kum-700 disabled:opacity-30"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setSatirlar((o) => [...o, { soru: "", cevap: "" }])}
      >
        <Plus className="size-4" aria-hidden />
        Satır ekle
      </Button>

      {tur.ipucu ? <FieldHint>{tur.ipucu}</FieldHint> : null}
    </Field>
  );
}
