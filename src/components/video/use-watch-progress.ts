"use client";

import { useCallback, useEffect, useRef } from "react";

import { izlemeKaydetAction } from "@/modules/video/progress-actions";

/** Bu kadar saniyede bir kaydet — sunucuyu gereksiz meşgul etmeden. */
const KAYIT_ARALIGI_SANIYE = 15;
/** Bu kadar ilerlemeden yeni kayıt gönderme. */
const ASGARI_ILERLEME_SANIYE = 5;

/**
 * Video izleme ilerlemesini sunucuya bildirir.
 *
 * Ne zaman gönderilir: 15 saniyede bir, duraklatınca, video bitince ve sayfa
 * gizlenince (sekme kapatma/arka plana alma dahil). Sadece süreye bakmak yetmez;
 * öğrenci videoyu izleyip sekmeyi kapatırsa son ilerleme kaybolurdu.
 *
 * `videoId` null ise hiçbir şey gönderilmez — admin önizlemesi ve girişsiz
 * public izleme öğrenci ilerlemesi gibi kaydedilmesin diye.
 */
export function useIzlemeKaydi(videoId: string | null) {
  const sonGonderilen = useRef(0);
  const sonDurum = useRef({ konum: 0, sure: 0 });

  const gonder = useCallback(
    (zorla = false) => {
      if (!videoId) return;
      const { konum, sure } = sonDurum.current;
      if (sure <= 0) return;
      if (!zorla && konum - sonGonderilen.current < ASGARI_ILERLEME_SANIYE) return;
      if (konum <= sonGonderilen.current && !zorla) return;

      sonGonderilen.current = konum;
      void izlemeKaydetAction({
        videoId,
        positionSec: konum,
        durationSec: sure,
      }).catch(() => undefined);
    },
    [videoId],
  );

  /** Oynatıcı her ilerlediğinde çağrılır; gönderim kararını kanca verir. */
  const bildir = useCallback((konum: number, sure: number) => {
    sonDurum.current = { konum, sure };
  }, []);

  // Düzenli kayıt.
  useEffect(() => {
    if (!videoId) return;
    const sayac = window.setInterval(() => gonder(), KAYIT_ARALIGI_SANIYE * 1000);
    return () => window.clearInterval(sayac);
  }, [videoId, gonder]);

  // Sekme kapanırken/arka plana alınırken son durumu kaydet.
  useEffect(() => {
    if (!videoId) return;
    const gizlendi = () => {
      if (document.visibilityState === "hidden") gonder(true);
    };
    document.addEventListener("visibilitychange", gizlendi);
    window.addEventListener("pagehide", () => gonder(true));
    return () => {
      document.removeEventListener("visibilitychange", gizlendi);
      // Bileşen kaldırılırken (başka sayfaya geçiş) de son durumu yolla.
      gonder(true);
    };
  }, [videoId, gonder]);

  return { bildir, kaydet: gonder };
}
