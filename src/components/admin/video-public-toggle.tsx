"use client";

import { Globe, Lock } from "lucide-react";
import { useActionState } from "react";

import { CopyField } from "@/components/admin/copy-field";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { IconSubmitButton } from "@/components/ui/icon-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { toggleVideoPublicAction } from "@/modules/video/actions";

/**
 * Public yapma anahtarı (PROJE.md §6d-e).
 * Sınıf başına 1 public video kuralı sunucuda zorlanır; burada yalnızca
 * kullanıcıya ne olacağı anlatılır.
 */
export function VideoPublicToggle({
  videoId,
  isPublic,
  publicSlug,
  siteOrigin,
  /**
   * Tablo satırı için sade sürüm: yalnızca ikon düğme.
   * Geniş sürüm altına link kutusu ve sonuç mesajı açtığı için satırı
   * iki katına çıkarıyordu; link zaten video sayfasında duruyor.
   */
  kompakt = false,
}: {
  videoId: string;
  isPublic: boolean;
  publicSlug: string | null;
  siteOrigin: string;
  kompakt?: boolean;
}) {
  const [state, formAction] = useActionState(
    toggleVideoPublicAction,
    EMPTY_ACTION_STATE,
  );

  const slug = state.data?.slug ?? publicSlug;
  const showLink = (state.data?.slug || (isPublic && publicSlug)) && !state.error;

  if (kompakt) {
    return (
      <form action={formAction}>
        <input type="hidden" name="videoId" value={videoId} />
        <input type="hidden" name="isPublic" value={String(!isPublic)} />
        <IconSubmitButton
          icon={isPublic ? Lock : Globe}
          label={
            isPublic
              ? "Herkese açıklığı kaldır"
              : "Örnek video yap (girişsiz izlenir)"
          }
        />
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <form action={formAction} className="contents">
        <input type="hidden" name="videoId" value={videoId} />
        <input type="hidden" name="isPublic" value={String(!isPublic)} />
        <SubmitButton
          variant={isPublic ? "secondary" : "altin"}
          size="sm"
          pendingLabel="Uygulanıyor…"
        >
          {isPublic ? (
            <>
              <Lock className="size-4" aria-hidden />
              Herkese açıklığı kaldır
            </>
          ) : (
            <>
              <Globe className="size-4" aria-hidden />
              Örnek video yap
            </>
          )}
        </SubmitButton>
      </form>

      <ActionFeedback state={state} />

      {showLink && slug ? (
        <CopyField label="Girişsiz izleme linki" value={`${siteOrigin}/izle/${slug}`} />
      ) : null}
    </div>
  );
}
