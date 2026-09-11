# Online Arapça Özel Ders Platformu

`www.onlinearapcaozelders.com` için Next.js tabanlı, mobil öncelikli online ders
platformu. Şartname: [PROJE.md](PROJE.md).

---

## Ne var, ne yok

**Var:** öğrenci/admin girişi, zorunlu ilk-giriş akışı, 4 cihaz limiti,
sınıf bazlı video erişimi, HLS ile korumalı video oynatma, girişsiz izlenen
örnek video (sınıf başına 1), duyurular, anonim anketler, düzenlenebilir
Hakkımızda sayfası, sınıf panelleri + genel panel.

**Oyun modülü:** dört tür — boşluk doldurma, kart (flashcard), eşleştirme ve
bulmaca. Admin yönetim panelinden hazırlar, öğrenci kendi sınıfının oyunlarını
oynar. İçerik `Game.content` alanında JSON olarak durur; şekli türe göre
değişir ve `src/modules/game/content.ts` içinde zod ile doğrulanır, böylece yeni
tür eklemek veritabanı değişikliği gerektirmez.

Bulmaca ızgarası elle çizilmez: öğretmen kelime + ipucu girer,
`src/modules/game/crossword.ts` yerleşimi ortak harflerden kesiştirerek üretir.
Kesişecek harf bulunamayan kelimeler dışarıda kalır ve admin'e bildirilir.

**Görsel dil:** oyun paleti İznik çinilerinden gelir — firuze, çini laciverti,
bolu kırmızısı, altın ve fıstık yeşili. Sitenin zümrüt/altın diliyle aynı
aileden: canlı ama yabancı değil. Kartların tamamı tür rengiyle boyanır (ince
bir üst çizgi değil) ve zeminlerinde logodaki sekiz kollu yıldız (rub el-hizb)
motifi döşenir. Tüm animasyonlar saf CSS (`globals.css` "Oyun modülü" bölümü):
11 keyframe, ek paket yok, `prefers-reduced-motion` açıkken hepsi kapanır.

**İlerleme:** öğrenci başına oyun başına tek satır (`GameProgress`) tutulur ve
hep EN İYİ sonucu gösterir; sonraki kötü denemeler başarıyı silmez. Skor
istemciden geldiği için (oyun tamamen tarayıcıda çalışıyor) "bu öğrenci bu
alıştırmayı yaptı mı" sorusunun cevabı sayılmalı, sınav notu gibi değil.

**Yayın bayrağı:** `OYUNLAR_OGRENCIYE_ACIK` (`src/lib/constants.ts`) şu an
`false`. Öğrenci menüsünde Oyunlar görünmüyor ve `/panel/oyun` adresleri 404
dönüyor; admin oyunları hazırlayıp `/yonetim/oyunlar/<id>/onizle` ile
deneyebiliyor (önizlemede ilerleme kaydedilmez). Yayına almak için bayrağı
`true` yapmak yeterli.

**Yok (şartname gereği kapsam dışı):** gerçek DRM, site üzerinden ödeme,
KVKK/iletişim sayfaları. Oyunlarda puan/ilerleme veritabanına kaydedilmiyor;
sonuç öğrenciye anında gösteriliyor.

---

## Kurulum

Hesap açma dahil adım adım anlatım: **[KURULUM.md](KURULUM.md)**. Aşağısı özet.

```bash
npm install
cp .env.example .env      # sonra .env içini doldurun (aşağıya bakın)
npm run kontrol           # neyin eksik olduğunu söyler
npm run db:deploy         # tabloları oluşturur
npm run db:seed           # admin hesabını oluşturur
npm run dev               # http://localhost:3000
```

`npm run kontrol` her adımdan sonra çalıştırabileceğiniz bir sağlık kontrolüdür:
eksik ortam değişkenlerini, veritabanı bağlantısını, tabloların varlığını, admin
hesabını ve R2 okuma/yazma iznini tek tek dener ve ne yapmanız gerektiğini yazar.

---

## 1. Veritabanı — Neon

1. [neon.tech](https://neon.tech) üzerinde ücretsiz bir proje açın.
2. **Connection string** bölümünden iki adresi kopyalayın:
   - *Pooled connection* → `DATABASE_URL`
   - *Direct connection* → `DIRECT_DATABASE_URL` (migration'lar bunu kullanır)
3. `npm run db:deploy` ile tabloları oluşturun.

> Şemayı değiştirdiğinizde: `npm run db:migrate` (yeni migration üretir).

## 2. Video deposu — Cloudflare R2

1. Cloudflare panelinde **R2 → Create bucket** (ör. `arapca-videolar`).
   Bucket'ı **public yapmayın**; erişim yalnızca imzalı linklerle olacak.
2. **R2 → Manage API Tokens → Create API Token**, yetki: *Object Read & Write*.
   Çıkan değerleri `.env` içine yazın (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).
3. `R2_ACCOUNT_ID` Cloudflare panelinin sağ üstündeki Account ID'dir.
4. **CORS ayarı zorunlu.** Tarayıcı hem yüklerken hem izlerken doğrudan R2'ye
   bağlandığı için bucket'ın CORS politikası gerekir:
   *Bucket → Settings → CORS Policy* altına şunu yapıştırın (adresleri kendi
   alan adınızla değiştirin):

```json
[
  {
    "AllowedOrigins": [
      "https://www.onlinearapcaozelders.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```

CORS eksikse belirti şudur: video yükleme "yüklenemedi" hatası verir veya
oynatıcı hiç başlamaz ("Video parçaları yüklenemedi").

Liste **tam eşleşme** arar: şema, host ve port birebir aynı olmalı. Bu yüzden
telefondan LAN adresiyle (`http://192.168.1.66:3000`) test edecekseniz o adresi
de listeye eklemeniz gerekir — `localhost:3000` onu kapsamaz. `npm run kontrol`
imzalı bir GET isteğini `Origin` başlığıyla atıp hangi adreslerin izinli
olduğunu ölçer (R2 `GetBucketCors` çağrısına izin vermiyor, politikayı API'den
okumak mümkün değil).

## 3. Auth

```bash
openssl rand -base64 32     # çıktıyı AUTH_SECRET'e yazın
```

`AUTH_URL` **tanımlamayın**; `AUTH_TRUST_HOST=true` yeterlidir ve önizleme
dağıtımlarında doğru adrese yönlenir.

## 4. Vercel'e dağıtım

1. Projeyi bir Git deposuna gönderip Vercel'de içe aktarın.
2. Vercel → *Settings → Environment Variables* altına `.env` içindeki tüm
   değişkenleri ekleyin.
3. Build komutu değiştirilmesine gerek yok (`npm run build` Prisma client'ı da
   üretir).
4. İlk dağıtımdan sonra bir kez `npm run db:deploy` ve `npm run db:seed`
   çalıştırın (yerelden, üretim `DATABASE_URL`'i ile).

---

## Video izleme ilerlemesi

Öğrenci başına video başına tek satır (`VideoProgress`) tutulur ve hep EN İLERİ
noktayı gösterir — geri sarıp bir yeri tekrar izlemek ilerlemeyi düşürmez.
Videonun **%90'ı** izlenince "izledi" sayılır (`IZLENDI_ESIGI`); %100 beklemek
gerçekçi değil, kapanış kısmını izlemeden çıkan öğrenci bitirmemiş sayılırdı.

Kayıt 15 saniyede bir, duraklatınca, video bitince ve sayfa gizlenince
(sekme kapatma dahil) gönderilir — sadece aralıklı kayıt yapılsaydı sekmeyi
kapatan öğrencinin son ilerlemesi kaybolurdu.

Öğrenci listede yüzde/"İzlendi" görür ve videoyu açtığında **kaldığı yerden**
devam eder.

Admin üç yerden bakabilir:
- **Video sayfası** (`/yonetim/videolar/<id>`) — o videoyu kim nereye kadar izlemiş
- **Video listesi** — her satırda "bitiren / izleyen" sayısı
- **Öğrenci sayfası** (`/yonetim/ogrenciler/<id>`) — o öğrencinin sınıfındaki
  tüm videolar ve oyunlardaki durumu. Hiç açılmamış içerikler de listede
  ("Açmadı" / "Oynamadı"): öğretmenin asıl sorusu genelde "neyi izlemedi".

Konum istemciden geldiği için (oynatma tarayıcıda) bu veri "öğrenci videoyu açtı
ve şuraya kadar geldi" bilgisidir, izlediğinin ispatı değildir.

## Neon uyku modu ve yeniden deneme

Neon'un ücretsiz planı bir süre işlem olmayınca veritabanını uyutur; uyanması
birkaç saniye sürdüğü için o aradaki **ilk sorgu** "Can't reach database server"
ile patlardı — yani günün ilk ziyaretçisi hata görürdü.

`src/lib/prisma.ts` bunu bir Prisma eklentisiyle çözer: yalnızca **bağlantı**
hatalarında sorgu 400ms / 1.2s / 2.5s aralıklarla üç kez daha denenir. Veri
hataları (benzersizlik ihlali, kayıt bulunamadı, yabancı anahtar) bilerek
süzülür — onları tekrar denemek çift kayıt üretebilirdi.

Kalıcı olarak tamamen kapatmak isterseniz Neon'un ücretli planında "scale to
zero" kapatılabilir; uygulama tarafında yapılacak bir şey kalmadı.

## Video yükleme akışı

Vercel'de ağır ffmpeg işi çalışamaz, öğretmenden de terminale girmesi
beklenemez. Bu yüzden dönüştürme **yükleyenin tarayıcısında** yapılır
(ffmpeg.wasm) — sunucuya maliyet çıkmaz, kullanıcı hiçbir program kurmaz.

Yönetim panelinde **Videolar → Video yükle → Video seç**; gerisi otomatik:

1. `src/modules/video/browser-transcode.ts` dosyanın kodeklerini okur.
2. Kodeklere göre en ucuz yolu seçer:
   - **kopyala** — video H.264, ses AAC/MP3 ise yeniden kodlama YOK, yalnızca
     HLS paketleme. Saniyeler sürer, kalite birebir korunur. Ders kayıtlarının
     çoğu buraya düşer.
   - **ses-kodla** — görüntü uyumlu, ses değil (ör. Opus). Sadece ses kodlanır.
   - **tam-kodla** — görüntü tarayıcıda oynatılamıyor (ör. iPhone HEVC).
     Yeniden kodlama şart; kullanıcıya süre tahmini gösterilip onay istenir.
3. Parçalar presigned link ile **doğrudan R2'ye** yüklenir; büyük dosya
   Vercel'e hiç uğramaz.

Hızlı yol tökezlerse (bozuk/alışılmadık dosya) arayüz yeniden kodlamayı seçenek
olarak sunar — sessizce saatler süren bir işe girmez.

**ffmpeg dosyaları** (~32 MB) git'e girmez; `npm install` ve `npm run build`
sırasında `scripts/ffmpeg-varliklari.mjs` ile `public/ffmpeg/<surum>/` altına
kopyalanır. Elle çalıştırmak için: `npm run ffmpeg:varliklar`. Sürüm adreste yer
aldığı için dosyalar bir yıl `immutable` önbelleklenebiliyor.

### Neden tek çekirdekli ffmpeg?

`@ffmpeg/core-mt` (çok çekirdekli) bilerek kullanılmıyor. Paketin kendi içinde
tutarsızlık var: pthread işçilerini **klasik** worker olarak açıyor
(`new Worker(url)`, tip belirtmeden) ama o worker dosyası çekirdeği dinamik
`import()` ile yüklüyor — bu klasik worker'larda desteklenmiyor. İşçiler ayağa
kalkamıyor, Emscripten'in `ready` sözü hiç çözülmüyor ve `@ffmpeg/ffmpeg` worker
hatalarını dinlemediği için `load()` **sonsuza kadar** bekliyor: kullanıcı
ekranda "hazırlanıyor" yazısıyla kalıyor, hata bile görmüyor.

Tek çekirdekli çekirdek hiç worker açmıyor, `SharedArrayBuffer` istemiyor ve
`export default` ile geliyor. Bedeli yalnızca yeniden kodlamanın yavaşlaması;
kopyalama yolu zaten G/Ç'ye bağlı olduğu için çok çekirdekten fayda görmüyordu.

Bu yüzden COOP/COEP başlıkları da kaldırıldı — yalnızca `SharedArrayBuffer`
için gerekliydi ve gereksiz izolasyon ileride eklenecek dış kaynakları sessizce
bloklardı. Ayrıca `ffmpeg.load()` bir zaman aşımıyla sarmalanıyor: beklenmedik
bir arıza sessiz donma yerine anlaşılır bir hata versin diye.

---

## Video koruması — beklenti yönetimi

Uygulanan katmanlar (şartname §2):

- Video HLS ile parça parça servis edilir; tek bir indirilebilir dosya linki yok.
- Playlist her istekte yeniden üretilir, segment linkleri **5 dakikada** ölür.
- Her oynatma isteğinde kullanıcı yetkisi ve cihaz oturumu yeniden doğrulanır.
- R2 bucket'ı public değil; erişim yalnızca imzalı isteklerle.
- Oynatıcıda sağ tık engeli, `controlsList="nodownload"`, video kaynağı MSE
  üzerinden beslendiği için gerçek adres DOM'da durmaz.

**Engellenemeyen:** ekran kaydı. Bu, gerçek DRM (Widevine/FairPlay) olmadan
mümkün değildir ve şartname gereği kapsam dışıdır. Safari/iOS'ta HLS yerel
oynatıldığı için playlist adresi `src` olarak verilmek zorundadır; adres yine
kısa ömürlü ve yetki kontrollüdür.

---

## Cihaz limiti — beklenti yönetimi

Bir hesap en fazla **4 cihazdan** kullanılabilir (`MAX_DEVICES_PER_USER` ile
değiştirilebilir). Cihaz ayrımı açık kaynak FingerprintJS ile yapılır ve
**%100 kesin değildir** (şartname §12.2 kabulü):

- Aynı bilgisayarda farklı tarayıcı → ayrı cihaz sayılabilir.
- Tarayıcı güncellemesi parmak izini kaydırabilir.

Bu yüzden iki kurtarma yolu var: öğrenci **Hesabım → Cihazlarım**'dan kendi
cihazını silebilir; admin ise öğrenci satırındaki **Cihazları sıfırla** ile
hepsini birden düşürebilir.

**Cihaz kimliği girişin önüne geçmez.** Kimlik bir kez üretilip localStorage'a
yazılır ve hep o kullanılır; kayıtlı kimlik yoksa FingerprintJS 3 saniye
denenir, yetişmezse yerel rastgele kimliğe düşülür. Giriş butonu hiçbir koşulda
kilitlenmez — önceki sürümde parmak izi telefonda takılınca öğrenci hiç giriş
yapamıyordu. `crypto.randomUUID` bilerek kullanılmaz: yalnızca güvenli bağlamda
tanımlı ve telefondan `http://192.168.x.x:3000` ile girildiğinde yoktur.

---

## Proje yapısı

```
prisma/
  schema.prisma            veri modeli
  migrations/              SQL migration'ları
  seed.ts                  ilk admin + Hakkımızda taslağı
scripts/
  ffmpeg-varliklari.mjs    ffmpeg.wasm dosyalarını public/'e kopyalar
  kontrol.mts              kurulum sağlık kontrolü
src/
  app/
    (ogrenci)/panel/       öğrenci paneli
    (yonetim)/yonetim/     admin paneli (genel + sınıf panelleri)
    api/                   auth, HLS playlist proxy, presigned upload
    giris/ ilk-giris/      giriş ve zorunlu ilk-giriş akışı
    izle/[slug]/           girişsiz örnek video
  modules/                 iş mantığı — her alan ayrı modül
    auth/ devices/ video/ announcements/ surveys/ students/ about/ game/
  components/              ui/ layout/ admin/ video/ ...
  lib/                     prisma, r2, i18n, sabitler, yardımcılar
```

**Modülerlik kuralı:** her modülde `service.ts` (veritabanı + iş kuralları) ve
gerekiyorsa `actions.ts` (server action) bulunur. Sayfalar iş kuralı içermez,
yalnızca modülleri çağırır. Oyun modülü için `src/modules/game/` ve
`/panel/oyun` route'u hazır ama boştur.

**Önbellek tazeleme:** hangi değişimde hangi sayfaların tazeleneceği
`src/lib/revalidate.ts` içinde, tek yerde tanımlıdır. Her server action kendi
listesini tuttuğunda birinin unuttuğu sayfa bayat kalıyordu. Dinamik sayfalar
route kalıbıyla (`"/yonetim/videolar/[id]"`) tazelenir; klasör adı değişince o
klasördeki bütün videoların sayfası etkilendiği için tek tek id saymak yetmez.
Ayrıca düzenleme formları kaydettikten sonra `router.refresh()` çağırır:
`revalidatePath` tek başına açık duran sayfayı güncellemiyor.

**Sunucudan istemciye fonksiyon geçirilemez.** İkon bileşenleri (`SquarePen`
gibi) birer fonksiyondur; sunucu bileşeninden istemci bileşenine prop olarak
verilince sayfa "Only plain objects can be passed to Client Components" ile
çöker. İki çözüm kullanılıyor: hook gerektirmeyen sarmalayıcılar istemci
bileşeni YAPILMAZ (`ui/icon-link.tsx`), gerekenler ise ikonu bileşen değil
**hazır element** olarak alır (`ikon={<Trash2 />}`).

**Form alanları kontrollü olmalı.** Klasör kutusu önce `defaultValue` ile
kontrolsüzdü; kaydettikten sonra sunucudan gelen render kutuyu eski değerle
yeniden yazıyor, seçim ekranda kayboluyordu (kayıt aslında olmuştu).

**Video klasörleri:** her klasör TEK BİR sınıfa aittir ve sınıf panelinden
yönetilir; 6. sınıfın "A Yayınevi" klasörüyle 7. sınıfınki ayrı kayıtlardır.
Klasör bilgisi `Video` üzerinde değil `VideoGrade` (video-sınıf eşleşmesi)
üzerinde durur: bir video birden fazla sınıfa işaretlenebildiği için "videonun
klasörü" diye tek bir cevap yok, sınıfı vermek gerekiyor.

**i18n:** arayüz bugün tamamen Türkçe, ama metinler `src/lib/i18n/` altındaki
sözlükten okunur ve yön (`dir`) tek yerden belirlenir — oyun modülüyle Arapça/RTL
geldiğinde altyapı hazır.

---

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run kontrol` | Kurulum sağlık kontrolü (.env, DB, tablolar, R2) |
| `npm run ffmpeg:varliklar` | ffmpeg.wasm dosyalarını public/ffmpeg'e kopyalar |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (Prisma client dahil) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint |
| `npm run db:deploy` | Migration'ları uygular (üretim) |
| `npm run db:migrate` | Yeni migration üretir (geliştirme) |
| `npm run db:seed` | Admin hesabı + Hakkımızda taslağı |
| `npm run db:studio` | Prisma Studio (veri görüntüleyici) |
