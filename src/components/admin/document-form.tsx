"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import {
  GradeFolderPicker,
  type SinifKlasorleri,
} from "@/components/admin/grade-folder-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/constants";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import {
  createDocumentAction,
  updateDocumentAction,
} from "@/modules/document/actions";
import { formatFileSize } from "@/lib/utils";

type DocMeta = {
  r2Key: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

/**
 * Doküman yükleme (yeni) veya düzenleme formu.
 * Yeni modda dosya seçimi + R2'ye yükleme; düzenleme modunda sadece meta.
 */
export function DocumentForm({
  document,
  foldersByGrade,
  selectedFolders,
}: {
  document?: {
    id: string;
    title: string;
    description: string | null;
    grades: number[];
    isActive: boolean;
    fileName: string;
    mimeType: string;
    fileSize: number;
  };
  foldersByGrade: SinifKlasorleri;
  selectedFolders?: Record<number, string | null>;
}) {
  const duzenleme = Boolean(document);
  const [state, formAction] = useActionState(
    duzenleme ? updateDocumentAction : createDocumentAction,
    EMPTY_ACTION_STATE,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  // Yükleme durumu (yalnızca yeni doküman)
  const [yukleme, setYukleme] = useState<"bos" | "yukluyor" | "tamam" | "hata">("bos");
  const [yuklemeHata, setYuklemeHata] = useState("");
  const [docMeta, setDocMeta] = useState<DocMeta | null>(null);
  const [ilerleme, setIlerleme] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const dosyaSec = useCallback(async (dosya: File) => {
    // Doğrulama
    if (!ALLOWED_DOCUMENT_TYPES[dosya.type]) {
      setYuklemeHata("Bu dosya türü desteklenmiyor. Desteklenen: PDF, Word, Excel, PowerPoint, TXT");
      setYukleme("hata");
      return;
    }
    if (dosya.size > MAX_DOCUMENT_SIZE_BYTES) {
      setYuklemeHata(`Dosya çok büyük (maks. ${formatFileSize(MAX_DOCUMENT_SIZE_BYTES)})`);
      setYukleme("hata");
      return;
    }

    setYukleme("yukluyor");
    setYuklemeHata("");
    setIlerleme(10);

    try {
      // 1. Presigned URL al
      const res = await fetch("/api/admin/documents/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: dosya.name,
          mimeType: dosya.type,
          fileSize: dosya.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Presigned URL alınamadı.");
      }

      const { r2Key, url } = await res.json();
      setIlerleme(30);

      // 2. Dosyayı R2'ye yükle
      const uploadRes = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", dosya.type);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setIlerleme(30 + Math.round((e.loaded / e.total) * 65));
          }
        });

        xhr.addEventListener("load", () => {
          resolve(new Response(null, { status: xhr.status }));
        });
        xhr.addEventListener("error", () => reject(new Error("Yükleme başarısız.")));
        xhr.send(dosya);
      });

      if (!uploadRes.ok) {
        throw new Error("Dosya R2'ye yüklenemedi.");
      }

      setIlerleme(100);
      setDocMeta({
        r2Key,
        fileName: dosya.name,
        mimeType: dosya.type,
        fileSize: dosya.size,
      });
      setYukleme("tamam");
    } catch (err) {
      setYuklemeHata(err instanceof Error ? err.message : "Yükleme başarısız.");
      setYukleme("hata");
    }
  }, []);

  return (
    <form action={formAction} className="space-y-5">
      {document ? (
        <input type="hidden" name="documentId" value={document.id} />
      ) : null}

      {/* Gizli alanlar: dosya bilgileri */}
      {docMeta ? (
        <>
          <input type="hidden" name="r2Key" value={docMeta.r2Key} />
          <input type="hidden" name="fileName" value={docMeta.fileName} />
          <input type="hidden" name="mimeType" value={docMeta.mimeType} />
          <input type="hidden" name="fileSize" value={docMeta.fileSize} />
        </>
      ) : null}

      <ActionFeedback state={state} />

      {/* Yeni doküman: dosya seçme alanı */}
      {!duzenleme ? (
        <Field>
          <Label>Dosya</Label>
          {yukleme === "bos" || yukleme === "hata" ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center justify-center gap-3 rounded-card border-2 border-dashed border-kum-300 bg-kum-50 px-4 py-8 text-sm text-kum-600 transition-colors hover:border-zumrut-400 hover:bg-zumrut-50/50 hover:text-zumrut-700"
              >
                <FileUp className="size-6" aria-hidden />
                <span>
                  Dosya seçin (PDF, Word, Excel, PowerPoint, TXT)
                  <br />
                  <span className="text-xs text-kum-400">
                    Maks. {formatFileSize(MAX_DOCUMENT_SIZE_BYTES)}
                  </span>
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const dosya = e.target.files?.[0];
                  if (dosya) dosyaSec(dosya);
                }}
              />
              {yukleme === "hata" ? (
                <Alert tone="error">{yuklemeHata}</Alert>
              ) : null}
            </>
          ) : yukleme === "yukluyor" ? (
            <div className="flex items-center gap-3 rounded-card border border-kum-200 bg-white p-4">
              <Loader2 className="size-5 animate-spin text-zumrut-600" aria-hidden />
              <div className="flex-1">
                <p className="text-sm font-medium text-kum-800">Yükleniyor…</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-kum-100">
                  <div
                    className="h-full rounded-full bg-zumrut-500 transition-all duration-300"
                    style={{ width: `${ilerleme}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-card border border-zumrut-200 bg-zumrut-50/50 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zumrut-100 text-zumrut-700">
                <FileUp className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-kum-900">
                  {docMeta?.fileName}
                </p>
                <p className="text-xs text-kum-500">
                  {docMeta ? formatFileSize(docMeta.fileSize) : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-zumrut-700">✓ Yüklendi</span>
            </div>
          )}
        </Field>
      ) : (
        <div className="flex items-center gap-3 rounded-card border border-kum-200 bg-white p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zumrut-50 text-zumrut-700">
            <FileUp className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-kum-900">
              {document?.fileName}
            </p>
            <p className="text-xs text-kum-500">
              {document ? formatFileSize(document.fileSize) : ""}
            </p>
          </div>
        </div>
      )}

      <Field>
        <Label htmlFor="title">Başlık</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={document?.title}
          placeholder="Ör. 3. Ünite çalışma kağıdı"
        />
      </Field>

      <Field>
        <Label htmlFor="description">Açıklama (isteğe bağlı)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={document?.description ?? ""}
        />
      </Field>

      <GradeFolderPicker
        foldersByGrade={foldersByGrade}
        selected={document?.grades ?? []}
        selectedFolders={selectedFolders ?? {}}
      />

      {duzenleme ? (
        <label className="flex items-center gap-2.5 text-sm text-kum-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={document?.isActive}
            className="size-4 accent-zumrut-700"
          />
          Yayında (kapatırsanız öğrenciler göremez)
        </label>
      ) : null}

      <SubmitButton
        size="lg"
        pendingLabel="Kaydediliyor…"
        disabled={!duzenleme && yukleme !== "tamam"}
      >
        {duzenleme ? "Kaydet" : "Dokümanı kaydet"}
      </SubmitButton>
    </form>
  );
}
