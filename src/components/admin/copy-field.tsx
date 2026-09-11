"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Geçici şifre / public link gibi tek seferlik değerleri kopyalatır. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano izni yoksa kullanıcı değeri elle seçebilir.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-kum-200 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-kum-500">{label}</p>
        <p className="truncate font-mono text-sm text-kum-900 select-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`${label} kopyala`}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-kum-500 transition-colors hover:bg-kum-100 hover:text-kum-800"
      >
        {copied ? (
          <Check className="size-4 text-zumrut-600" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
