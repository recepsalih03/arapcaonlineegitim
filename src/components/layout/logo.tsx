import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Marka işareti. Ayrı bir görsel dosyası yok: sekiz köşeli yıldız (rub el-hizb)
 * SVG olarak gömülü — hem hafif hem tema rengiyle uyumlu.
 */
export function Logo({
  className,
  tone = "yesil",
  metniGizleMobil = false,
}: {
  className?: string;
  tone?: "yesil" | "beyaz";
  /** true ise marka metni mobilde gizlenir, yalnızca ikon görünür (dar
      header'larda nav'a yer açmak için). sm ve üstünde metin görünür. */
  metniGizleMobil?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-tight",
        tone === "beyaz" ? "text-white" : "text-zumrut-800",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          tone === "beyaz" ? "bg-white/15" : "bg-zumrut-700",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            d="M12 2.5 15 5.5h4.5V10l3 2-3 2v4.5H15L12 21.5 9 18.5H4.5V14l-3-2 3-2V5.5H9z"
            stroke={tone === "beyaz" ? "#fff" : "#ddbc70"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "leading-tight whitespace-nowrap",
          metniGizleMobil && "hidden sm:block",
        )}
      >
        <span className="block text-[13px] font-medium opacity-70">Online</span>
        <span className="block text-[15px]">Arapça Özel Ders</span>
      </span>
    </Link>
  );
}
