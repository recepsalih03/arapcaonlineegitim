# Online Arapça Özel Ders Platformu

Ortaokul öğrencilerine yönelik Arapça özel ders platformu.
Öğretmen dersleri yükler, öğrenci kendi sınıfının videolarını izler ve
alıştırmaları oynar. Arayüz tamamen Türkçe ve mobil önceliklidir.

Yayın adresi: **www.onlinearapcaozelders.com** · Şartname: [PROJE.md](PROJE.md)
· Sıfırdan kurulum: [KURULUM.md](KURULUM.md)

## İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Ortam değişkenleri](#ortam-değişkenleri)
- [Servis ayarları](#servis-ayarları)
- [Vercel'e dağıtım](#vercele-dağıtım)
- [Komutlar](#komutlar)
- [Proje yapısı](#proje-yapısı)
- [Tasarım kararları](#tasarım-kararları)
- [Kapsam dışı](#kapsam-dışı)

## Özellikler

**Öğrenci tarafı**

- Kullanıcı adı + şifre ile giriş; ilk girişte şifre değiştirme zorunlu.
- Bir hesap en fazla 4 cihazdan kullanılabilir (`MAX_DEVICES_PER_USER`).
- Sadece kendi sınıfının (5–8) içeriğini görür.
- Videolar klasörlere ayrılmış halde listelenir; kaldığı yerden devam eder.
- Oyunlar: boşluk doldurma, kelime kartı, eşleştirme ve bulmaca.
- Duyurular ve anonim anketler.

**Yönetim tarafı**

- Öğrenci ekleme, şifre sıfırlama, cihazları sıfırlama.
- Video yükleme: dosya seçmek yeterli, dönüştürme tarayıcıda yapılır.
- Sınıf başına ayrı video klasörleri (6. sınıfın "A Yayınevi" klasörü
  7. sınıfınkinden bağımsızdır).
- Kim neyi ne kadar izledi / hangi oyunu kaç puanla bitirdi raporu.
- Başlangıç ve bitiş tarihi verilebilen duyurular, anketler.
- Girişsiz izlenebilen tanıtım videosu (`/izle/<slug>`).

**Video koruması**

- HLS ile parça parça servis; tek parça indirilebilir dosya linki yok.
- Playlist her istekte yeniden üretilir, parça linkleri 5 dakikada ölür.
- Her oynatma isteğinde yetki ve cihaz oturumu yeniden doğrulanır.
- R2 kovası public değil; erişim yalnızca imzalı isteklerle.

## Teknolojiler

| Katman | Seçim |
|---|---|
| Çatı | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Arayüz | Tailwind CSS v4, lucide ikonlar, saf CSS animasyonlar |
| Veritabanı | PostgreSQL (Neon), Prisma 7 (`@prisma/adapter-pg`) |
| Kimlik | Auth.js v5 (credentials + JWT), bcrypt |
| Depolama | Cloudflare R2 (S3 uyumlu), imzalı PUT/GET |
| Video | HLS, hls.js; dönüştürme tarayıcıda ffmpeg.wasm ile |
| Barındırma | Vercel |

## Hızlı başlangıç

Gereken: Node.js 20+, bir Neon veritabanı ve bir Cloudflare R2 kovası.
Hesap açmayı da içeren adım adım anlatım için [KURULUM.md](KURULUM.md).

```bash
npm install
# .env dosyasını oluşturun (aşağıdaki şablon)
npm run kontrol     # neyin eksik olduğunu tek tek söyler
npm run db:deploy   # tabloları oluşturur
npm run db:seed     # admin hesabını oluşturur
npm run dev         # http://localhost:3000
```

`npm run kontrol` her adımdan sonra çalıştırılabilen bir sağlık kontrolüdür:
ortam değişkenlerini, veritabanı bağlantısını, tabloların şemayla uyumunu,
admin hesabını, R2 okuma/yazma iznini ve CORS ayarını dener; eksik olan her şey
için ne yapılacağını yazar.

## Ortam değişkenleri

Proje kökünde `.env` dosyası oluşturup aşağıdakileri doldurun. Bu dosya git'e
**girmez**; aynı değerleri Vercel'de de tanımlamanız gerekir.

```ini
# --- Veritabanı (Neon / PostgreSQL) ---
# Neon'un verdiği adreste sslmode=require yazar; verify-full yapın.
DATABASE_URL="postgresql://kullanici:sifre@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full"
# Migration'lar havuzsuz (direct) bağlantı ister.
DIRECT_DATABASE_URL="postgresql://kullanici:sifre@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full"

# --- Auth.js ---
# Üretmek için: openssl rand -base64 32
AUTH_SECRET=""
AUTH_TRUST_HOST="true"

# --- Cloudflare R2 ---
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="arapca-videolar"
R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"

# --- Uygulama ---
MAX_DEVICES_PER_USER="4"
# Yalnızca "npm run db:seed" okur.
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_PASSWORD=""
```

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | evet | Havuzlanmış (pooled) Postgres adresi; uygulama bunu kullanır |
| `DIRECT_DATABASE_URL` | evet | Havuzsuz adres; yalnızca migration'lar kullanır |
| `AUTH_SECRET` | evet | Oturum çerezlerini imzalar. Üretimde farklı olmalı |
| `AUTH_TRUST_HOST` | evet | Vercel proxy'si arkasında gerekli |
| `R2_ACCOUNT_ID` | evet | Cloudflare panelinin sağ üstündeki Account ID |
| `R2_ACCESS_KEY_ID` | evet | R2 API token'ı (*Object Read & Write*) |
| `R2_SECRET_ACCESS_KEY` | evet | Aynı token'ın gizli anahtarı |
| `R2_BUCKET` | evet | Kova adı |
| `R2_ENDPOINT` | evet | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `MAX_DEVICES_PER_USER` | hayır | Varsayılan 4 |
| `SEED_ADMIN_USERNAME` | hayır | Varsayılan `admin` |
| `SEED_ADMIN_PASSWORD` | seed için | En az 10 karakter; `db:seed` dışında okunmaz |
| `DEV_ORIGINS` | hayır | Geliştirmede telefondan erişim için ek adres |

`AUTH_URL` **tanımlamayın**. `AUTH_TRUST_HOST=true` iken Auth.js adresi isteğin
kendisinden okur; elle sabitlenirse önizleme dağıtımları ve farklı portlar
yanlış adrese yönlenir.

## Servis ayarları

### Neon

*Connection string* kutusundan iki adres kopyalanır: **Pooled** olan
`DATABASE_URL`, **Direct** olan `DIRECT_DATABASE_URL`. Şema değiştiğinde
`npm run db:migrate` yeni migration üretir, `npm run db:deploy` uygular.

### Cloudflare R2

Kovayı **public yapmayın**; erişim yalnızca imzalı linklerle olur.
Token yetkisi *Object Read & Write* olmalı ve süresiz (TTL'siz) verilmeli.

**CORS ayarı zorunludur.** Tarayıcı hem yüklerken hem izlerken doğrudan R2'ye
bağlanır. *Bucket → Settings → CORS Policy*:

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

CORS eksikse belirti şudur: video yükleme "yüklenemedi" der ya da oynatıcı
hiç başlamaz ("Video parçaları yüklenemedi").

Liste **tam eşleşme** arar — şema, host ve port birebir aynı olmalı. Telefondan
LAN adresiyle (`http://192.168.1.66:3000`) test edecekseniz o adresi de eklemek
gerekir; `localhost:3000` onu kapsamaz. `npm run kontrol` imzalı bir GET
isteğini `Origin` başlığıyla atıp hangi adreslerin izinli olduğunu ölçer
(R2 `GetBucketCors` çağrısına izin vermediği için politika API'den okunamıyor).

## Vercel'e dağıtım

1. Depoyu Vercel'de içe aktarın.
2. *Settings → Environment Variables* altına `.env` içindeki tüm değişkenleri
   ekleyin (`AUTH_SECRET` üretim için yeniden üretilmeli).
3. Build komutunu değiştirmeye gerek yok; `npm run build` Prisma client'ı ve
   ffmpeg dosyalarını da hazırlar.
4. İlk dağıtımdan sonra bir kez `npm run db:deploy` ve `npm run db:seed`
   çalıştırın (yerelden, üretim adresiyle).
5. R2 CORS listesine üretim alan adınızı ekleyin.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (Prisma client + ffmpeg dosyaları dahil) |
| `npm run kontrol` | Kurulum sağlık kontrolü (.env, DB, tablolar, R2, CORS) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Birim testleri |
| `npm run lint` | ESLint |
| `npm run db:deploy` | Migration'ları uygular (üretim) |
| `npm run db:migrate` | Yeni migration üretir (geliştirme) |
| `npm run db:seed` | İlk admin hesabını oluşturur |
| `npm run db:studio` | Prisma Studio (veri görüntüleyici) |
| `npm run ffmpeg:varliklar` | ffmpeg.wasm dosyalarını `public/ffmpeg`'e kopyalar |

## Proje yapısı

```
prisma/
  schema.prisma          veri modeli
  migrations/            SQL migration'ları
  seed.ts                ilk admin hesabı
scripts/
  kontrol.mts            kurulum sağlık kontrolü
  ffmpeg-varliklari.mjs  ffmpeg.wasm dosyalarını public/'e kopyalar
src/
  app/
    (ogrenci)/panel/     öğrenci paneli
    (yonetim)/yonetim/   admin paneli (genel + sınıf panelleri)
    api/                 auth, HLS playlist proxy, imzalı yükleme
    giris/ ilk-giris/    giriş ve zorunlu ilk-giriş akışı
    izle/[slug]/         girişsiz tanıtım videosu
  modules/               iş mantığı: auth, devices, video, game,
                         announcements, surveys, students
  components/            ui/ layout/ admin/ video/ game/
  lib/                   prisma, r2, i18n, sabitler, yardımcılar
```

**Modülerlik kuralı:** her modülde `service.ts` (veritabanı + iş kuralları),
gerekiyorsa `actions.ts` (server action) bulunur. Sayfalar iş kuralı içermez,
yalnızca modülleri çağırır.

## Tasarım kararları

Aşağıdakiler "neden böyle yapıldı" notlarıdır; hepsi bir hatanın ya da bir
kısıtın sonucudur.

### Video dönüştürme neden tarayıcıda?

Vercel'de ağır ffmpeg işi çalışamaz, öğretmenden de terminale girmesi
beklenemez. Bu yüzden dönüştürme yükleyenin tarayıcısında yapılır: sunucuya
maliyet çıkmaz, kullanıcı hiçbir program kurmaz.

`src/modules/video/browser-transcode.ts` önce dosyanın kodeklerini okur ve en
ucuz yolu seçer:

- **kopyala** — video H.264, ses AAC/MP3 ise yeniden kodlama yok, yalnızca HLS
  paketleme. Saniyeler sürer, kalite birebir korunur. Ders kayıtlarının çoğu
  buraya düşer.
- **ses-kodla** — görüntü uyumlu, ses değil (ör. Opus). Yalnızca ses kodlanır.
- **tam-kodla** — görüntü tarayıcıda oynatılamıyor (ör. iPhone HEVC). Yeniden
  kodlama şart; kullanıcıya süre tahmini gösterilip onay istenir.

Parçalar imzalı linkle doğrudan R2'ye yüklenir; büyük dosya Vercel'e hiç
uğramaz. ffmpeg dosyaları (~32 MB) git'e girmez, `npm install` ve
`npm run build` sırasında `public/ffmpeg/<surum>/` altına kopyalanır.

**Neden tek çekirdekli ffmpeg?** `@ffmpeg/core-mt` paketinin kendi içinde
tutarsızlık var: pthread işçilerini klasik worker olarak açıyor ama o worker
çekirdeği dinamik `import()` ile yüklüyor — klasik worker'larda desteklenmiyor.
İşçiler ayağa kalkamıyor, Emscripten'in `ready` sözü hiç çözülmüyor ve
`@ffmpeg/ffmpeg` worker hatalarını dinlemediği için `load()` sonsuza kadar
bekliyor; kullanıcı "hazırlanıyor" yazısıyla kalıyor, hata bile görmüyor. Tek
çekirdekli çekirdek worker açmıyor, `SharedArrayBuffer` istemiyor. Bedeli
yalnızca yeniden kodlamanın yavaşlaması; kopyalama yolu zaten G/Ç'ye bağlı.
Bu yüzden COOP/COEP başlıkları da kaldırıldı.

### İlerleme kayıtları ne anlama geliyor?

Video için öğrenci başına video başına tek satır (`VideoProgress`) tutulur ve
hep **en ileri** nokta gösterilir — geri sarmak ilerlemeyi düşürmez. Videonun
%90'ı izlenince "izledi" sayılır (`IZLENDI_ESIGI`); %100 beklemek gerçekçi
değildi, kapanışı izlemeden çıkan öğrenci bitirmemiş sayılıyordu.

Kayıt 15 saniyede bir, duraklatınca, video bitince ve sayfa gizlenince
gönderilir. Sadece aralıklı kayıt yapılsaydı sekmeyi kapatan öğrencinin son
ilerlemesi kaybolurdu.

Oyunda ise (`GameProgress`) hep **en iyi** sonuç saklanır; sonraki kötü
denemeler başarıyı silmez.

Her iki veri de istemciden geldiği için (oynatma ve oyun tarayıcıda çalışıyor)
"öğrenci bunu açtı ve şuraya kadar geldi" bilgisidir — sınav notu gibi
değerlendirilmemelidir.

### Neon uyku modu

Neon'un ücretsiz planı işlem olmayınca veritabanını uyutur; uyanması birkaç
saniye sürdüğü için o aradaki ilk sorgu "Can't reach database server" ile
patlardı — günün ilk ziyaretçisi hata görürdü.

`src/lib/prisma.ts` bunu bir Prisma eklentisiyle çözer: yalnızca **bağlantı**
hatalarında sorgu 400 ms / 1,2 sn / 2,5 sn aralıklarla üç kez daha denenir. Veri
hataları (benzersizlik ihlali, kayıt bulunamadı, yabancı anahtar) bilerek
süzülür — onları tekrar denemek çift kayıt üretebilirdi.

### Cihaz limiti kesin değildir

Cihaz ayrımı açık kaynak FingerprintJS ile yapılır ve %100 kesin değildir:
aynı bilgisayarda farklı tarayıcı ayrı cihaz sayılabilir, tarayıcı güncellemesi
parmak izini kaydırabilir. Bu yüzden iki kurtarma yolu var: öğrenci
**Hesabım → Cihazlarım**'dan kendi cihazını silebilir, admin ise öğrenci
satırındaki **Cihazları sıfırla** ile hepsini birden düşürür.

**Cihaz kimliği girişin önüne geçmez.** Kimlik bir kez üretilip localStorage'a
yazılır; kayıtlı kimlik yoksa FingerprintJS 3 saniye denenir, yetişmezse yerel
rastgele kimliğe düşülür. Giriş butonu hiçbir koşulda kilitlenmez — önceki
sürümde parmak izi telefonda takılınca öğrenci hiç giriş yapamıyordu.
`crypto.randomUUID` bilerek kullanılmaz: yalnızca güvenli bağlamda tanımlıdır
ve telefondan `http://192.168.x.x:3000` ile girildiğinde yoktur.

### Video klasörleri neden `VideoGrade` üzerinde?

Her klasör tek bir sınıfa aittir ve sınıf panelinden yönetilir. Bir video birden
fazla sınıfa işaretlenebildiği için "videonun klasörü" diye tek bir cevap yok;
klasör bilgisi bu yüzden `Video` üzerinde değil, video-sınıf eşleşmesinde
(`VideoGrade`) durur. Böylece aynı video 5. sınıfta başka, 6. sınıfta başka bir
klasörde görünebiliyor.

### Oyun içeriği neden JSON?

Dört tür var: boşluk doldurma, kart, eşleştirme, bulmaca. İçerik `Game.content`
alanında JSON olarak durur ve `src/modules/game/content.ts` içinde zod ile
doğrulanır; yeni tür eklemek veritabanı değişikliği gerektirmez.

Bulmaca ızgarası elle çizilmez: öğretmen kelime + ipucu girer,
`src/modules/game/crossword.ts` yerleşimi ortak harflerden kesiştirerek üretir.
Kesişecek harf bulunamayan kelimeler dışarıda kalır ve admin'e bildirilir.

Görsel dil İznik çinilerinden gelir — firuze, çini laciverti, bolu kırmızısı,
altın, fıstık yeşili. Tüm animasyonlar saf CSS'tir (`globals.css`), ek paket
yoktur ve `prefers-reduced-motion` açıkken hepsi kapanır.

### Önbellek tazeleme tek yerden

Hangi değişimde hangi sayfaların tazeleneceği `src/lib/revalidate.ts` içinde
tanımlıdır. Her server action kendi listesini tuttuğunda birinin unuttuğu sayfa
bayat kalıyordu. Dinamik sayfalar route kalıbıyla (`"/yonetim/videolar/[id]"`)
tazelenir; klasör adı değişince o klasördeki bütün videoların sayfası
etkilendiği için tek tek id saymak yetmiyor. Düzenleme formları ayrıca
`router.refresh()` çağırır: `revalidatePath` tek başına açık duran sayfayı
güncellemiyor.

### Sunucudan istemciye fonksiyon geçirilemez

İkon bileşenleri (`SquarePen` gibi) birer fonksiyondur; sunucu bileşeninden
istemci bileşenine prop olarak verilince sayfa "Only plain objects can be passed
to Client Components" ile çöker. İki çözüm kullanılıyor: hook gerektirmeyen
sarmalayıcılar istemci bileşeni **yapılmaz** (`ui/icon-link.tsx`), gerekenler
ise ikonu bileşen değil hazır **element** olarak alır (`ikon={<Trash2 />}`).

### i18n altyapısı

Arayüz bugün tamamen Türkçe, ama metinler `src/lib/i18n/` altındaki sözlükten
okunur ve yön (`dir`) tek yerden belirlenir; Arapça/RTL içerik geldiğinde
altyapı hazır.

## Kapsam dışı

Şartname gereği yapılmayanlar:

- **Gerçek DRM (Widevine/FairPlay).** Yukarıdaki katmanlar videoyu indirmeyi
  zorlaştırır ama **ekran kaydını engellemez**; bu DRM olmadan mümkün değildir.
  Safari/iOS'ta HLS yerel oynatıldığı için playlist adresi `src` olarak
  verilmek zorundadır — adres yine kısa ömürlü ve yetki kontrollüdür.
- Site üzerinden ödeme.
- KVKK ve iletişim sayfaları.
- Hakkımızda sayfası bilerek boştur; metin verilince doğrudan
  `src/app/hakkimizda/page.tsx` içine yazılacaktır.
