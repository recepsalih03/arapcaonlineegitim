import { GRADES, gradeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Çoklu sınıf seviyesi seçici (PROJE.md §6a, §7).
 * Video/duyuru/anket formlarının hepsi bunu kullanır — kural tek yerde durur.
 */
export function GradePicker({
  name = "grades",
  selected = [],
  className,
}: {
  name?: string;
  selected?: number[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {GRADES.map((grade) => (
        <label
          key={grade}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-kum-200 bg-white px-3 py-2 text-sm text-kum-700 transition-colors has-checked:border-zumrut-500 has-checked:bg-zumrut-50 has-checked:text-zumrut-800"
        >
          <input
            type="checkbox"
            name={name}
            value={grade}
            defaultChecked={selected.includes(grade)}
            className="size-4 accent-zumrut-700"
          />
          {gradeLabel(grade)}
        </label>
      ))}
    </div>
  );
}
