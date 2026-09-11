# Oyun Modülü (sonraki faz)

PROJE.md §10 ve §13 gereği bu modül **şimdilik boştur**. Duolingo tarzı oyun
kısmı bu fazda yapılmayacak; yalnızca yeri ayrılmıştır.

Hazır olan iskelet:

- Bu klasör (`src/modules/game/`) — oyun mantığı, durum makinesi, puanlama.
- `src/app/(ogrenci)/panel/oyun/` — öğrenci tarafındaki route (şu an "yakında").
- `src/lib/i18n/` — Arapça sözlük ve RTL yön desteği baştan kurulu, çünkü oyun
  içeriği Arapça olacak.

Modül eklenirken diğer modüllerin (video, duyuru, anket) yapısı takip edilmeli:
`service.ts` (veritabanı + iş kuralları), `actions.ts` (server action),
bileşenler ise `src/components/` altında.
