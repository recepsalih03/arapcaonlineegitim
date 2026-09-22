"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
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
  sorular?: Array<{
    soru: string;
    secenekler: [string, string, string, string];
    dogruIndex: number;
  }>;
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
      ) : type === "TEST" ? (
        <TestEditoru sorular={game?.sorular ?? []} />
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

const HARFLER = ["A", "B", "C", "D"] as const;

function TestEditoru({
  sorular: baslangicSorulari,
}: {
  sorular: Array<{
    soru: string;
    secenekler: [string, string, string, string];
    dogruIndex: number;
  }>;
}) {
  const [sorular, setSorular] = useState(
    baslangicSorulari.length > 0
      ? baslangicSorulari
      : [
          {
            soru: "",
            secenekler: ["", "", "", ""] as [string, string, string, string],
            dogruIndex: 0,
          },
        ],
  );

  function soruMetniDegistir(index: number, metin: string) {
    setSorular((prev) =>
      prev.map((s, i) => (i === index ? { ...s, soru: metin } : s)),
    );
  }

  function secenekDegistir(
    soruIdx: number,
    secenekIdx: number,
    deger: string,
  ) {
    setSorular((prev) =>
      prev.map((s, i) => {
        if (i !== soruIdx) return s;
        const yeniSecenekler = [...s.secenekler] as [
          string,
          string,
          string,
          string,
        ];
        yeniSecenekler[secenekIdx] = deger;
        return { ...s, secenekler: yeniSecenekler };
      }),
    );
  }

  function dogruSec(soruIdx: number, dogruIndex: number) {
    setSorular((prev) =>
      prev.map((s, i) => (i === soruIdx ? { ...s, dogruIndex } : s)),
    );
  }

  function soruEkle() {
    setSorular((prev) => [
      ...prev,
      {
        soru: "",
        secenekler: ["", "", "", ""],
        dogruIndex: 0,
      },
    ]);
  }

  function soruSil(soruIdx: number) {
    if (sorular.length <= 1) return;
    setSorular((prev) => prev.filter((_, i) => i !== soruIdx));
  }

  return (
    <Field>
      <div className="flex items-center justify-between">
        <Label>Test Soruları ({sorular.length})</Label>
        <span className="text-xs text-kum-500">
          Yeşil işaretli şık doğru cevaptır
        </span>
      </div>

      <div className="space-y-6">
        {sorular.map((soru, sIdx) => (
          <div
            key={sIdx}
            className="rounded-xl border border-kum-200 bg-kum-50/50 p-4 transition-colors sm:p-5"
          >
            {/* Soru Başlığı & Sil */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-kum-800">
                {sIdx + 1}. Soru
              </span>
              <button
                type="button"
                onClick={() => soruSil(sIdx)}
                disabled={sorular.length <= 1}
                aria-label={`${sIdx + 1}. soruyu sil`}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-kum-400 transition-colors hover:bg-kum-200 hover:text-kirmizi-600 disabled:invisible"
              >
                <Trash2 className="size-3.5" aria-hidden />
                <span>Sil</span>
              </button>
            </div>

            {/* Soru Metni */}
            <div className="mb-4">
              <Textarea
                name="test-soru"
                value={soru.soru}
                onChange={(e) => soruMetniDegistir(sIdx, e.target.value)}
                placeholder={`${sIdx + 1}. sorunun metnini yazın…`}
                rows={2}
                required
                className="bg-white"
              />
            </div>

            {/* Doğru şık gizli girdi */}
            <input type="hidden" name="test-dogru" value={soru.dogruIndex} />

            {/* 4 Şık */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {HARFLER.map((harf, oIdx) => {
                const dogruMu = soru.dogruIndex === oIdx;
                const inputName = `test-secenek-${oIdx}`;
                return (
                  <div
                    key={harf}
                    className={`flex items-center gap-2 rounded-lg border p-1.5 transition-colors ${
                      dogruMu
                        ? "border-zumrut-400 bg-zumrut-50/60 ring-1 ring-zumrut-400"
                        : "border-kum-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => dogruSec(sIdx, oIdx)}
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md font-semibold text-xs transition-all ${
                        dogruMu
                          ? "bg-zumrut-600 text-white shadow-xs"
                          : "bg-kum-100 text-kum-600 hover:bg-kum-200"
                      }`}
                      title={
                        dogruMu
                          ? "Doğru şık olarak işaretli"
                          : "Doğru şık olarak işaretlemek için tıklayın"
                      }
                    >
                      {dogruMu ? <Check className="size-4" /> : harf}
                    </button>

                    <Input
                      name={inputName}
                      value={soru.secenekler[oIdx] ?? ""}
                      onChange={(e) =>
                        secenekDegistir(sIdx, oIdx, e.target.value)
                      }
                      placeholder={`${harf} şıkkı`}
                      required
                      className="border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0"
                    />

                    {dogruMu && (
                      <span className="mr-2 shrink-0 text-[11px] font-medium text-zumrut-700">
                        Doğru
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={soruEkle}
          className="border border-dashed border-kum-300 hover:border-kum-400"
        >
          <Plus className="size-4" aria-hidden />
          Yeni soru ekle
        </Button>
      </div>

      <FieldHint>
        Her soru için 4 şık belirleyin ve doğru olan şıkkın harfine tıklayarak
        işaretleyin.
      </FieldHint>
    </Field>
  );
}
