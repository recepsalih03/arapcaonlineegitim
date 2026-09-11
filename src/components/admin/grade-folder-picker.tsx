"use client";

import { useState } from "react";

import { Field, FieldHint, Label, Select } from "@/components/ui/field";
import { GRADES, gradeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type SinifKlasorleri = Record<number, Array<{ id: string; name: string }>>;

/**
 * Sınıf seçimi + seçilen HER SINIF için ayrı klasör kutusu.
 *
 * Klasörler sınıfa özel olduğu için tek bir "klasör" alanı yetmiyor: aynı video
 * iki sınıfa işaretlenirse her sınıfta farklı bir klasöre düşebilmeli.
 * Klasör kutusu yalnızca o sınıf seçiliyken ve o sınıfın klasörü varken görünür.
 */
export function GradeFolderPicker({
  foldersByGrade,
  selected = [],
  selectedFolders = {},
}: {
  foldersByGrade: SinifKlasorleri;
  selected?: number[];
  selectedFolders?: Record<number, string | null>;
}) {
  const [secili, setSecili] = useState<number[]>(selected);
  /*
   * Klasör kutusu KONTROLLÜ olmak zorunda.
   *
   * Önce defaultValue ile kontrolsüzdü ve şu hata çıkıyordu: kaydettikten
   * sonra sunucudan gelen yeni render, kutunun defaultValue'sunu kaydetmeden
   * önceki değerle (klasörsüz) yeniden yazıyor, ekranda seçim kayboluyordu.
   * Kayıt aslında olmuştu; sayfadan çıkıp girince doğru görünüyordu.
   */
  const [klasorSecimi, setKlasorSecimi] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      Object.entries(selectedFolders).map(([g, id]) => [g, id ?? ""]),
    ),
  );

  function degistir(grade: number, isaretli: boolean) {
    setSecili((onceki) =>
      isaretli
        ? [...onceki, grade].sort((a, b) => a - b)
        : onceki.filter((g) => g !== grade),
    );
  }

  return (
    <div className="space-y-3">
      <Field>
        <Label>Hangi sınıflar görecek?</Label>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((grade) => (
            <label
              key={grade}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                secili.includes(grade)
                  ? "border-zumrut-500 bg-zumrut-50 text-zumrut-800"
                  : "border-kum-200 bg-white text-kum-700",
              )}
            >
              <input
                type="checkbox"
                name="grades"
                value={grade}
                checked={secili.includes(grade)}
                onChange={(olay) => degistir(grade, olay.target.checked)}
                className="size-4 accent-zumrut-700"
              />
              {gradeLabel(grade)}
            </label>
          ))}
        </div>
      </Field>

      {secili.map((grade) => {
        const klasorler = foldersByGrade[grade] ?? [];
        if (klasorler.length === 0) return null;
        return (
          <Field key={grade}>
            <Label htmlFor={`folder-${grade}`}>
              {gradeLabel(grade)} klasörü
            </Label>
            <Select
              id={`folder-${grade}`}
              name={`folder-${grade}`}
              value={klasorSecimi[grade] ?? ""}
              onChange={(olay) =>
                setKlasorSecimi((onceki) => ({
                  ...onceki,
                  [grade]: olay.target.value,
                }))
              }
            >
              <option value="">Klasörsüz</option>
              {klasorler.map((klasor) => (
                <option key={klasor.id} value={klasor.id}>
                  {klasor.name}
                </option>
              ))}
            </Select>
          </Field>
        );
      })}

      {secili.length > 0 &&
      secili.every((g) => (foldersByGrade[g] ?? []).length === 0) ? (
        <FieldHint>
          Seçtiğiniz sınıfların klasörü yok. Klasörleri sınıf panelinden
          oluşturabilirsiniz.
        </FieldHint>
      ) : null}
    </div>
  );
}
