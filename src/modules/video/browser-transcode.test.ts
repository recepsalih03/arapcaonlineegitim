import assert from "node:assert/strict";
import test from "node:test";

import { akisiTuket } from "./browser-transcode";

function yanitYap(parcalar: number[], kopsun: boolean, toplam?: number): Response {
  // Parçalar TEK TEK, istendikçe verilir: gerçek bir indirmede olduğu gibi
  // önce birkaç parça ulaşır, sonra bağlantı kopar.
  let sira = 0;
  const akis = new ReadableStream<Uint8Array>({
    pull(kontrol) {
      if (sira < parcalar.length) {
        kontrol.enqueue(new Uint8Array(parcalar[sira++]));
        return;
      }
      if (kopsun) kontrol.error(new TypeError("Load failed"));
      else kontrol.close();
    },
  });
  const basliklar = new Headers();
  if (toplam !== undefined) basliklar.set("content-length", String(toplam));
  return new Response(akis, { headers: basliklar });
}

test("akış ortada koparsa hata ATMAZ", async () => {
  const gorulen: number[] = [];
  await akisiTuket(yanitYap([100, 100], true, 1000), (o) => gorulen.push(o));
  assert.ok(gorulen.length >= 1, "kopmadan önceki ilerleme bildirilmeli");
  assert.ok(!gorulen.includes(1), "yarım kalan indirme %100 diye bildirilmemeli");
});

test("akış ilk okumada koparsa da hata ATMAZ", async () => {
  await akisiTuket(yanitYap([], true, 1000));
});

test("tam inen akış %100 bildirir", async () => {
  const gorulen: number[] = [];
  await akisiTuket(yanitYap([500, 500], false, 1000), (o) => gorulen.push(o));
  assert.equal(gorulen.at(-1), 1);
});

test("content-length yoksa ilerleme bildirilmez ama yine de biter", async () => {
  const gorulen: number[] = [];
  await akisiTuket(yanitYap([10], false), (o) => gorulen.push(o));
  assert.deepEqual(gorulen, [1]);
});

test("gövdesiz yanıt sessizce geçilir", async () => {
  await akisiTuket(new Response(null, { status: 204 }));
});
