import assert from "node:assert/strict";
import test from "node:test";

import { beklemeSuresiMs, degerlendir, SERBEST_DENEME } from "./throttle-logic";

test("serbest deneme sınırına kadar bekleme yok", () => {
  for (let i = 0; i <= SERBEST_DENEME; i++) {
    assert.equal(beklemeSuresiMs(i), 0, `${i}. denemede bekleme olmamalı`);
  }
});

test("eşik aşılınca bekleme başlar ve kademeli artar", () => {
  // 6. hata: ilk kademe (30 sn)
  assert.equal(beklemeSuresiMs(SERBEST_DENEME + 1), 30_000);
  // 11. hata: ikinci kademe (2 dk)
  assert.equal(beklemeSuresiMs(SERBEST_DENEME + 6), 2 * 60_000);
  // 16. hata: üçüncü kademe (10 dk)
  assert.equal(beklemeSuresiMs(SERBEST_DENEME + 11), 10 * 60_000);
});

test("bekleme bir tavanda durur, sonsuza gitmez", () => {
  const tavan = beklemeSuresiMs(1000);
  assert.equal(tavan, 60 * 60_000, "tavan 1 saat olmalı");
  assert.equal(beklemeSuresiMs(100000), tavan, "çok büyük sayıda da tavan sabit");
});

test("bekleme monoton artar (hiç azalmaz)", () => {
  let onceki = 0;
  for (let i = 0; i <= 40; i++) {
    const simdi = beklemeSuresiMs(i);
    assert.ok(simdi >= onceki, `${i}. denemede bekleme azaldı`);
    onceki = simdi;
  }
});

test("degerlendir: kilit yoksa açık", () => {
  assert.deepEqual(degerlendir(null), { kilitli: false });
});

test("degerlendir: geçmiş tarih açık sayılır", () => {
  assert.deepEqual(degerlendir(new Date(Date.now() - 1000)), { kilitli: false });
});

test("degerlendir: gelecek tarih kilitli ve kalan süre yukarı yuvarlanır", () => {
  const sonuc = degerlendir(new Date(Date.now() + 4500));
  assert.equal(sonuc.kilitli, true);
  if (sonuc.kilitli) {
    assert.ok(sonuc.kalanSaniye >= 4 && sonuc.kalanSaniye <= 5);
  }
});
