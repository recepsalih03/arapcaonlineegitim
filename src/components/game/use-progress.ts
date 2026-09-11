"use client";

import { useCallback, useRef } from "react";

import { ilerlemeKaydetAction } from "@/modules/game/progress-actions";

/**
 * Oyun ilerlemesini sunucuya bildirir.
 *
 * İki kural sunucuya gereksiz istek gitmesini engelliyor:
 *  - Skor yalnızca ÖNCEKİNDEN İYİYSE gönderilir. Öğrenci "Kontrol et"e üst üste
 *    bassa bile aynı sonuç tekrar tekrar yollanmaz.
 *  - Deneme sayısı yalnızca bu bileşenin ilk gönderiminde artar; sayfada
 *    kaldığı sürece tek deneme sayılır.
 *
 * Kayıt başarısız olursa oyun akışı bozulmaz: öğrencinin oynamasını
 * engellemektense bir ilerleme kaydını kaybetmek yeğdir.
 *
 * `gameId` null ise hiçbir şey gönderilmez — admin önizlemesinde öğretmenin
 * denemeleri öğrenci ilerlemesi gibi kaydedilmesin diye.
 */
export function useIlerleme(gameId: string | null) {
  const enIyiGonderilen = useRef(-1);
  const ilkGonderimYapildi = useRef(false);

  return useCallback(
    (dogru: number, toplam: number) => {
      if (gameId === null || toplam <= 0) return;
      if (dogru <= enIyiGonderilen.current) return;

      enIyiGonderilen.current = dogru;
      const yeniDeneme = !ilkGonderimYapildi.current;
      ilkGonderimYapildi.current = true;

      void ilerlemeKaydetAction({ gameId, dogru, toplam, yeniDeneme }).catch(
        () => undefined,
      );
    },
    [gameId],
  );
}
