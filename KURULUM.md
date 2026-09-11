# Kurulum — Adım Adım

Bu dosya **sizin yapmanız gerekenleri** sırayla anlatır. Yazılım tarafı bitti;
eksik olan tek şey hesap açıp bilgileri `.env` dosyasına yazmanız.

Toplam süre: yaklaşık **30-40 dakika**. Hiçbir adımda kredi kartı gerekmiyor.

Her adımın sonunda ne olması gerektiğini yazdım. Takıldığınız yerde en alttaki
**Sorun giderme** bölümüne bakın.

---

## Adım 0 — Terminali açın

Mac'te **Spotlight** (⌘ + boşluk) → "Terminal" yazıp Enter. Sonra:

```bash
cd ~/Desktop/arapca
```

Bundan sonraki bütün komutları bu pencerede çalıştıracaksınız.

Kontrol edelim — şunu yazın:

```bash
npm run kontrol
```

Şu an her şeyin eksik olduğunu söyleyecek. Normal. Bu komut sizin pusulanız
olacak: her adımdan sonra tekrar çalıştırıp neyin eksik kaldığını göreceksiniz.

---

## Adım 1 — Neon (veritabanı) — ~10 dakika

Öğrenciler, videolar, duyurular burada saklanacak. Ücretsiz plan bu proje için
fazlasıyla yeterli.

**1.1** [console.neon.tech](https://console.neon.tech) adresine gidin →
**Sign up** → Google veya GitHub hesabınızla girin.

**1.2** Karşınıza "Create your first project" ekranı gelecek:

- **Project name**: `arapca` yazın
- **Postgres version**: dokunmayın (varsayılan)
- **Region**: **Europe (Frankfurt)** seçin — Türkiye'ye en yakını, site daha hızlı açılır
- **Create project** butonuna basın

**1.3** Proje açılınca **Connection string** kutusu görünecek. Burada
dikkat edilecek iki şey var:

- Kutunun üstünde bir açılır menü var: **Connection pooling** yazan seçeneğin
  **açık** olduğundan emin olun (adreste `-pooler` geçmeli).
- **Show password** / göz simgesine basın ki adres şifreyi de içersin.

**Copy** deyip adresi kopyalayın. Şuna benzeyecek:

```
postgresql://neondb_owner:npg_AbC123xyz@ep-cool-sun-12345678-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Küçük ama faydalı bir düzeltme:** adreste `sslmode=require` yazan yeri
`sslmode=verify-full` yapın. Sertifika doğrulaması tam olur ve her komutta
çıkan bir SSL uyarısından kurtulursunuz. (İki adres için de yapın.)

**1.4** Şimdi bu adresi `.env` dosyasına yazacağız. Dosya zaten VS Code'da
açık; değilse şu komutla açın:

```bash
open -a "Visual Studio Code" .env
```

> Proje klasöründe `.env` dosyası yoksa (ör. projeyi GitHub'dan yeni
> indirdiyseniz) önce oluşturun: [README.md](README.md#ortam-değişkenleri)
> içindeki "Ortam değişkenleri" şablonunu kopyalayıp `.env` adıyla kaydedin.
> Bu dosya gizli bilgiler içerdiği için GitHub'a hiç gönderilmez.

`DATABASE_URL=""` satırını bulun ve **tırnakların arasına** yapıştırın:

```
DATABASE_URL="postgresql://neondb_owner:npg_AbC123xyz@ep-cool-sun-12345678-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full"
```

**1.5** Şimdi ikinci adres. Neon'da aynı **Connection string** kutusuna dönün,
**Connection pooling** seçeneğini bu sefer **kapatın**. Adresten `-pooler`
kısmı kaybolacak. Bu adresi kopyalayıp `DIRECT_DATABASE_URL` satırına yazın:

```
DIRECT_DATABASE_URL="postgresql://neondb_owner:npg_AbC123xyz@ep-cool-sun-12345678.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full"
```

> İki adres arasındaki tek fark `-pooler` kelimesi. Birincisi sitenin günlük
> kullanımı için, ikincisi tablo oluşturma gibi işler için.

**1.6** Dosyayı kaydedin (⌘ + S) ve terminalde:

```bash
npm run kontrol
```

Artık "Neon veritabanı" başlığı altında **✓ Bağlantı kuruldu** görmelisiniz.
Tablolar için hâlâ hata verecek — sıradaki adım o.

---

## Adım 2 — Tabloları oluşturun — ~1 dakika

```bash
npm run db:deploy
```

Bu komut veritabanında 11 tabloyu oluşturur (öğrenciler, videolar, duyurular,
anketler, cihazlar...). "All migrations have been successfully applied" gibi
bir mesaj görmelisiniz.

---

## Adım 3 — Admin hesabınızı oluşturun — ~2 dakika

**3.1** `.env` dosyasında en alttaki iki satırı düzenleyin:

```
SEED_ADMIN_USERNAME="hoca"
SEED_ADMIN_PASSWORD="buraya-guclu-bir-sifre-yazin"
```

- Kullanıcı adı: küçük harf, boşluksuz, Türkçe karaktersiz olsun (`hoca`,
  `ogretmen`, `salih` gibi).
- Şifre: **en az 12 karakter**. Bu sizin site yöneticisi şifreniz — güçlü olsun.
  Bir yere not edin; unutursanız bu adımı tekrar yapmanız gerekir.

> `degistir-beni` değerini olduğu gibi bırakırsanız komut çalışmayı reddeder —
> herkesin bildiği bir şifreyle yönetici hesabı açılmasın diye.

Kaydedin (⌘ + S).

**3.2** Terminalde:

```bash
npm run db:seed
```

"Admin oluşturuldu: hoca" mesajını görmelisiniz.

> Bu komutu ikinci kez çalıştırırsanız hesabı bozmaz, şifreyi değiştirmez —
> sadece "zaten var" der.

---

## Adım 4 — Cloudflare R2 (video deposu) — ~15 dakika

Videolar burada duracak. Cloudflare'in ücretsiz planı 10 GB depolama veriyor
ve **izleme trafiği tamamen ücretsiz** — bu yüzden seçildi.

**4.1** [dash.cloudflare.com](https://dash.cloudflare.com) → **Sign up**.

**4.2** Sol menüden **R2 Object Storage** → **Create bucket**.

> Cloudflare ilk R2 kullanımında kredi kartı bilgisi isteyebilir. Ücretsiz
> sınırlar içinde ücret yansımaz, ama istemezseniz burada durup bana haber
> verin — alternatif konuşabiliriz.

**4.3** Bucket ayarları:

- **Bucket name**: `arapca-videolar` (`.env` dosyasında bu isim yazılı,
  farklı bir isim verirseniz `R2_BUCKET` satırını da değiştirin)
- **Location**: **Automatic** bırakın
- **Create bucket**

> **Önemli:** Bucket'ı public YAPMAYIN. "Public access" veya "Allow Access"
> gibi bir seçenek görürseniz kapalı bırakın. Videolara erişim yalnızca sitenin
> ürettiği, birkaç dakikada sona eren imzalı linklerle olacak.

**4.4 — Account ID'yi alın.** R2 ana sayfasında sağ tarafta **Account ID**
yazan bir kutu var (32 karakterlik harf-rakam dizisi). Kopyalayın ve `.env`
dosyasına yazın:

```
R2_ACCOUNT_ID="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
```

**4.5 — API anahtarlarını üretin.** R2 sayfasında **Manage API Tokens** /
**API** bağlantısına girin. Karşınıza **iki bölüm** çıkacak:

- **Account API Tokens** ← **bunu kullanın** (üstteki "Create Account API token")
- User API Tokens ← kullanmayın

Fark şu: User token sizin kullanıcı hesabınıza bağlıdır ve hesaptan ayrılırsanız
ölür; site o an videoları göstermeyi bırakır. Account token hesabın kendisine
bağlıdır, Cloudflare de üretim için bunu öneriyor.

Formu şöyle doldurun:

- **Token name**: `arapca-site`
- **Permissions**: **Object Read & Write** ← *en kritik yer. "Object Read only"
  seçerseniz video yükleyemezsiniz.*
- **Specify bucket(s)**: `arapca-videolar` seçin — token yalnızca o bucket'a
  erişir, daha güvenli
- **TTL / Expiration**: süresiz bırakın; süre verirseniz o gün geldiğinde
  videolar sessizce açılmaz olur
- **Create Account API Token**

**4.6** Çıkan ekranda üç değer göreceksiniz. **Bu sayfa bir daha
gösterilmez**, hemen kopyalayın:

- **Access Key ID** → `.env` içindeki `R2_ACCESS_KEY_ID`
- **Secret Access Key** → `.env` içindeki `R2_SECRET_ACCESS_KEY`
- **Endpoint** (`https://<account-id>.r2.cloudflarestorage.com`) → `R2_ENDPOINT`

Endpoint satırı şöyle görünecek:

```
R2_ENDPOINT="https://a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.r2.cloudflarestorage.com"
```

Kaydedin ve kontrol edin:

```bash
npm run kontrol
```

R2 başlığı altında **✓ Bucket okunabiliyor** ve **✓ Yazma ve silme izni var**
görmelisiniz.

**4.7 — CORS ayarı (atlanırsa video çalışmaz).**

Tarayıcı videoları doğrudan R2'den çektiği için R2'nin "bu siteye izin ver"
demesi gerekiyor. Bucket sayfasında **Settings** sekmesi → **CORS Policy**
bölümü → **Add CORS policy** / **Edit**.

Açılan kutuya şunu yapıştırın:

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

**Save**. Bu adımı atlarsanız her şey doğru görünür ama video yükleme
"yüklenemedi" der ve oynatıcı sonsuza kadar döner — en sinsi hata budur.

---

## Adım 5 — Siteyi bilgisayarınızda açın — ~2 dakika

```bash
npm run kontrol     # her şey ✓ olmalı
npm run dev
```

Tarayıcıda **http://localhost:3000** adresini açın.

Şimdi sırayla deneyin:

1. Ana sayfa açılıyor mu?
2. Sağ üstten **Giriş Yap** → 3. adımda belirlediğiniz kullanıcı adı ve şifreyle
   girin → **Yönetim** paneline düşmelisiniz.
3. **Öğrenciler** → sınıf seçin → **Yeni öğrenci oluştur** → size bir kullanıcı
   adı ve geçici şifre verecek. Kopyalayın.
4. Tarayıcının **gizli sekmesinde** localhost:3000/giris adresine gidip bu
   öğrenci bilgileriyle girin → sizden kullanıcı adı ve şifre değiştirmenizi
   isteyecek. Öğrencilerinizin göreceği akış budur.

Sunucuyu durdurmak için terminalde **Ctrl + C**.

---

## Adım 6 — İlk videoyu yükleyin — ~5 dakika

Hiçbir program kurmanıza gerek yok. Video dönüştürme işi tarayıcının içinde,
yükleme sayfasında otomatik yapılıyor.

**6.1** `npm run dev` ile siteyi açın → **Yönetim → Videolar → Video yükle**.

**6.2** **Video seç** deyin ve ders videonuzu olduğu gibi seçin (mp4, mov, mkv…).

**6.3** Gerisi kendiliğinden ilerler:

1. Video incelenir (birkaç saniye).
2. Parçalara ayrılır — ekranda ilerleme çubuğu görürsünüz.
3. Parçalar doğrudan Cloudflare'e yüklenir.

> **İlk seferde** dönüştürücü indirilir (~32 MB), bu yüzden biraz daha uzun
> sürer. Sonraki yüklemelerde tarayıcı önbelleğinden gelir.

**6.4** "Video hazır ve yüklendi" yazısını görünce başlığı yazın, hangi
sınıfların göreceğini işaretleyin (birden fazla seçebilirsiniz) ve
**Videoyu kaydet**.

**Sayfayı işlem bitene kadar kapatmayın.** Başka sekmelerde çalışmaya devam
edebilirsiniz.

### Ne kadar sürer?

Videonuz yaygın bir biçimdeyse (ekran kaydı, Zoom kaydı, çoğu MP4) **yeniden
kodlama yapılmaz** — sadece paketleme değişir, kalite birebir korunur ve işlem
**saniyeler sürer**.

Yalnızca tarayıcıların oynatamadığı bir biçimse (tipik örnek: iPhone'un HEVC
kaydı) yeniden kodlama gerekir ve bu **çok yavaştır** — 40 dakikalık bir video
için 1,5–3 saat. O durumda size tahmini süre gösterilip onayınız istenir; işlem
sürerken **Vazgeç** ile durdurabilirsiniz.

**Bunu tamamen önlemenin yolu — bunu mutlaka yapın:** iPhone'da
**Ayarlar → Kamera → Biçimler → En Uyumlu** seçeneğini açın. Bundan sonraki tüm
kayıtlar uyumlu biçimde olur ve yükleme hep saniyeler sürer. Tek seferlik bir
ayardır ve saatlerce beklemekten kurtarır.

Elinizde zaten HEVC çekilmiş uzun bir video varsa ve beklemek istemiyorsanız
bana yazın; o dosyalar için panele daha hızlı bir yol ekleyebilirim.

### Çok büyük videolar

Tarayıcı dosyayı belleğe aldığı için 2,5 GB üstü dosyalar kabul edilmiyor,
1 GB üstünde de yavaşlayabilir. Uzun dersleri bölüm bölüm yüklemek hem sizin
hem öğrencilerin işine yarar.

## Adım 7 — Siteyi internete alın (Vercel) — ~30 dakika

Kod GitHub'da hazır: **github.com/recepsalih03/arapcaonlineegitim**.
Alan adı da alındı. Geriye üç iş kaldı: Vercel'e kurmak, alan adını
yönlendirmek, sonucu doğrulamak.

> **Veritabanı ve videolar zaten bulutta.** Neon ve R2 ilk günden internette
> olduğu için yayına geçerken veri taşımıyorsunuz: öğrenciler, videolar,
> duyurular olduğu gibi kalıyor. `db:deploy` / `db:seed` komutlarını **tekrar
> çalıştırmayın**, tablolar ve admin hesabınız zaten yerinde.

**7.1 — Vercel hesabı açın.**

[vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub** →
GitHub hesabınızla izin verin. Hobby (ücretsiz) plan bu site için yeterli.

**7.2 — Projeyi içe aktarın.**

**Add New → Project** → listede `arapcaonlineegitim` deposunu bulup **Import**.

Framework'ü kendisi "Next.js" olarak tanır; **build ayarlarına dokunmayın.**
Ama **Deploy'a basmadan önce** aşağıdaki **Environment Variables** bölümünü
açın.

**7.3 — Ortam değişkenlerini girin.**

`.env` dosyanızı VS Code'da açın ve `#` ile başlayan yorum satırları hariç
her satırı Vercel'e tek tek ekleyin (Name = eşittirden önceki kısım,
Value = tırnakların içindeki değer):

| Name | Value |
|---|---|
| `DATABASE_URL` | .env'deki değer |
| `DIRECT_DATABASE_URL` | .env'deki değer |
| `AUTH_SECRET` | **yeni bir değer** (aşağıya bakın) |
| `AUTH_TRUST_HOST` | `true` |
| `R2_ACCOUNT_ID` | .env'deki değer |
| `R2_ACCESS_KEY_ID` | .env'deki değer |
| `R2_SECRET_ACCESS_KEY` | .env'deki değer |
| `R2_BUCKET` | `arapca-videolar` |
| `R2_ENDPOINT` | .env'deki değer |
| `MAX_DEVICES_PER_USER` | `4` |

`SEED_ADMIN_USERNAME` ve `SEED_ADMIN_PASSWORD` satırlarını **eklemeyin** —
onlar yalnızca ilk admin hesabını oluştururken yerelde kullanıldı.

`AUTH_SECRET` için yenisini üretin ve **yalnızca Vercel'e** yazın:

```bash
openssl rand -base64 32
```

> Neden yeni? Bu değer oturum çerezlerini imzalıyor. Yereldeki ile üretimdeki
> ayrı olursa, birinin ele geçmesi diğerini etkilemez.

**Deploy** deyin. 2–3 dakika sürer.

**7.4 — Önce geçici adreste deneyin.**

Vercel size `arapcaonlineegitim-xxxx.vercel.app` gibi bir adres verecek. Alan
adına geçmeden önce burada şunları test edin:

- Giriş yapabiliyor musunuz (admin ve bir öğrenci hesabıyla)
- Bir video açılıyor mu (0:00'da kalmamalı)
- Yönetim panelinde öğrenci/video listeleri geliyor mu

Burada bir sorun varsa alan adını bağlamadan önce halledin; adres bağlıyken
uğraşmak daha zor olur.

**7.5 — Alan adını Vercel'e tanıtın.**

Vercel'de proje → **Settings → Domains** → kutuya
`www.onlinearapcaozelders.com` yazın → **Add**.

Sonra aynı yere `onlinearapcaozelders.com` (www'suz hali) ekleyin ve Vercel'in
sunduğu **Redirect to www.onlinearapcaozelders.com** seçeneğini işaretleyin.
Böylece iki adres de aynı yere gider.

Vercel şimdi size girmeniz gereken DNS kayıtlarını gösterecek. **Ekranda yazan
değerleri kullanın**, başka bir rehberden gördüğünüz IP'yi değil — Vercel bu
adresleri zaman zaman değiştiriyor. Genelde şu ikisi olur:

| Tür | Ad (Host) | Değer |
|---|---|---|
| `CNAME` | `www` | Vercel'in gösterdiği adres (`...vercel-dns.com` ile biter) |
| `A` | `@` | Vercel'in gösterdiği IP |

**7.6 — Wix'te DNS kayıtlarını değiştirin.**

Alan adını **Wix** üzerinden aldınız, yani şu an alan adı Wix'in sunucularını
gösteriyor. Onu Vercel'e çevireceğiz.

[wix.com](https://www.wix.com) → giriş yapın → sağ üstteki hesap menüsü →
**Domains** → `onlinearapcaozelders.com` satırında **...** → **Manage DNS
Records** (Türkçe arayüzde *DNS Kayıtlarını Yönet*).

Burada:

1. **CNAME bölümü** → `www` adına ait bir kayıt varsa **düzenleyin**, yoksa
   **Add Record** ile ekleyin. Değeri Vercel'in verdiği `...vercel-dns.com`
   adresi olacak.
2. **A (Host) bölümü** → `@` adına ait kayıtlarda Wix'in IP'leri yazıyor.
   Bunları silip Vercel'in verdiği IP'yi girin.
3. Kaydedin. Wix "siteniz yayından kalkacak" gibi bir uyarı verirse onaylayın —
   zaten Wix'te bir site yayınlamıyorsunuz.

> **Alternatif ve daha temiz yol:** Wix'te **Advanced → Change Name Servers**
> ile nameserver'ları Vercel'in verdiği `ns1.vercel-dns.com` /
> `ns2.vercel-dns.com` adresleriyle değiştirebilirsiniz. O zaman tüm DNS
> yönetimi Vercel'e geçer ve tek tek kayıt girmezsiniz. E-posta hizmeti
> kullanmıyorsanız bu yol daha kolaydır.

**Alan adını başka bir firmaya taşımayı şimdilik denemeyin:** ICANN kuralı
gereği yeni alınmış bir `.com` 60 gün boyunca transfer edilemez. Zaten gerek de
yok; DNS'i yönlendirmek yeterli.

**7.7 — Bekleyin ve doğrulayın.**

DNS değişikliği genelde 10 dakika–2 saat içinde yayılır (nadiren 24 saat).
Vercel → **Settings → Domains** sayfasındaki uyarılar kendiliğinden yeşile
döner ve SSL sertifikası otomatik kurulur — HTTPS için hiçbir şey yapmanıza
gerek yok.

Yeşile dönünce `https://www.onlinearapcaozelders.com` adresini açıp giriş ve
video testini bir kez daha yapın.

**7.8 — R2 CORS'u doğrulayın.**

Videoların yayında da oynaması için R2'nin izin listesinde sitenizin adresi
olmalı. Kontrol etmek için:

```bash
npm run kontrol
```

Çıktıda şu satırı arayın:

```
✓ CORS izinli — yayındaki site: https://www.onlinearapcaozelders.com
```

Kırmızıysa Cloudflare → R2 → bucket → **Settings → CORS Policy** →
`AllowedOrigins` listesine bu adresi ekleyin.

**7.9 — Bundan sonra nasıl güncelleme yapılır?**

Kodda bir değişiklik olduğunda terminalde:

```bash
git add .
git commit -m "değişikliğin kısa açıklaması"
git push
```

Vercel push'u görüp siteyi kendisi yeniden yayınlar; başka bir şey yapmanız
gerekmez.

## Telefondan test etmek

Aynı Wi-Fi'daki telefonunuzdan bilgisayarınızdaki siteyi açabilirsiniz.
`npm run dev` çalışırken terminalde yazan **Network** adresini kullanın:

```
- Network: http://192.168.1.66:3000
```

Bu adresi telefonun tarayıcısına yazın. Next, güvenlik gereği localhost dışından
gelen istekleri normalde engelliyor; `next.config.ts` içindeki
`allowedDevOrigins` ayarı yaygın ev ağı adreslerini (192.168.x.x, 10.x.x.x…)
zaten açıyor. Farklı bir ağdaysanız:

```bash
DEV_ORIGINS="192.168.2.15" npm run dev
```

> Bu yalnızca geliştirme içindir. Siteyi Vercel'e aldıktan sonra telefondan
> normal alan adıyla girersiniz, böyle bir ayara gerek kalmaz.

**Telefonda video izlemek için bir adım daha var.** Video parçaları tarayıcıya
doğrudan R2'den geliyor ve R2 yalnızca CORS listesindeki adreslere cevap veriyor.
Adım 4.7'de bu listeye `http://localhost:3000` yazmıştınız; telefon oraya değil
`http://192.168.1.66:3000` gibi bir adrese bağlanıyor. Bu yüzden bilgisayarda
açılan video telefonda "0:00 / 0:00" da kalır.

Çözüm: R2 CORS politikasındaki `AllowedOrigins` listesine kendi Network
adresinizi de ekleyin:

```json
"AllowedOrigins": [
  "https://www.onlinearapcaozelders.com",
  "http://localhost:3000",
  "http://192.168.1.66:3000"
]
```

`npm run kontrol` bunu artık kendisi ölçüyor; hangi adresin izinli olduğunu
satır satır yazar. **Üretimde gerekmez**, orada sitenin alan adı yeterli.

## Sorun giderme

| Belirti | Sebebi | Çözüm |
|---|---|---|
| `npm run kontrol` → "Bağlanılamadı" | Adres eksik kopyalanmış (şifre kısmı yok) | Neon'da **Show password** açıkken tekrar kopyalayın |
| `db:deploy` → "Connection url is empty" | `.env` kaydedilmemiş ya da satır boş kalmış | `.env`'i kaydedip (⌘+S) `npm run kontrol` ile doğrulayın |
| "SECURITY WARNING: The SSL modes..." | `sslmode=require` yazıyor | İki adreste de `sslmode=verify-full` yapın (Adım 1.3) |
| "Hiçbir tablo yok" | Adım 2 atlanmış | `npm run db:deploy` |
| "Admin hesabı yok" | Adım 3 atlanmış | `npm run db:seed` |
| Video yükleme "yüklenemedi" diyor | R2 CORS ayarı yok | Adım 4.7'yi yapın |
| Oynatıcı sonsuza kadar dönüyor | Yine CORS | Adım 4.7'yi yapın |
| Telefonda video "0:00 / 0:00" da kalıyor (bilgisayarda çalışıyor) | R2 CORS listesinde telefonun bağlandığı LAN adresi yok | `npm run kontrol` çalıştırın, yazdığı adresi CORS `AllowedOrigins` listesine ekleyin |
| "Erişim reddedildi" (R2) | Token "Read only" yetkiyle üretilmiş | Yeni token: **Object Read & Write** |
| Bir süre sonra videolar açılmaz oldu | Token'a süre (TTL) verilmiş ya da User API token kullanılmış | Süresiz bir **Account API token** üretip `.env` ve Vercel değişkenlerini güncelleyin |
| Öğrenci "en fazla 4 cihaz" hatası alıyor | Parmak izi kaymış olabilir | Yönetim → Öğrenciler → o öğrenci → **Cihazları sıfırla** |
| Öğrenci şifresini unuttu | — | Yönetim → Öğrenciler → **Yeni şifre ver** |
| Dönüştürme "uzun sürecek" uyarısı veriyor | Video HEVC biçiminde (genelde iPhone) | Onaylayıp bekleyin; kalıcı çözüm için iPhone'da **Ayarlar → Kamera → Biçimler → En Uyumlu** |
| "Video dönüştürücü dosyaları bulunamadı" | ffmpeg dosyaları kopyalanmamış | `npm run ffmpeg:varliklar` |
| Telefonda giriş butonu çalışmıyor / sayfa donuk | Dev sunucusu LAN adresini engelliyor | Terminalde "Blocked cross-origin request" yazar; `DEV_ORIGINS` ile adresi ekleyip yeniden başlatın |
| Dönüştürme çok yavaş | Tarayıcı hızlandırmayı kapatmış | Chrome veya Safari'nin güncel sürümünü kullanın |
| Vercel'de "Domain is not configured" | DNS kayıtları henüz yayılmadı | 1–2 saat bekleyin; sürerse Wix'teki kaydın Vercel'in gösterdiği değerle birebir aynı olduğunu kontrol edin |
| Alan adı hâlâ eski Wix sayfasını gösteriyor | Tarayıcı önbelleği veya eski A kaydı | Gizli sekmede deneyin; Wix'te `@` altındaki eski IP kayıtlarının silindiğinden emin olun |
| Yayındaki sitede video 0:00'da kalıyor | R2 CORS listesinde alan adı yok | `npm run kontrol` → "yayındaki site" satırına bakın, kırmızıysa adresi CORS'a ekleyin |
| Yayındaki sitede video yüklenemiyor ("bağlanılamadı", "Load failed") | Sitenin o anki adresi R2 CORS listesinde yok — geçici `...vercel.app` adresinde çalışırken sık olur | Hata mesajında yazan adresi R2 > Settings > CORS Policy > AllowedOrigins listesine ekleyin |
| Yayındaki sitede giriş yapılamıyor | Vercel'de `AUTH_SECRET` veya `AUTH_TRUST_HOST` eksik | Vercel → Settings → Environment Variables → ekleyip **Redeploy** edin |

Takıldığınız yerde `npm run kontrol` çıktısının ekran görüntüsünü bana
gönderin, nerede kaldığınızı oradan görebilirim.

---

## Günlük kullanım — kısa özet

Kurulum bittikten sonra rutininiz şu:

**Yeni öğrenci:** Yönetim → ilgili sınıf → Yeni öğrenci oluştur → çıkan
kullanıcı adı ve geçici şifreyi öğrenciye ilet. Öğrenci ilk girişte ikisini de
kendi belirleyecek.

**Yeni ders videosu:** Yönetim → Videolar → Video yükle → videoyu seç → dönüşüm
bitince başlık ve sınıfları gir → kaydet.

**Duyuru / anket:** Yönetim → Duyurular veya Anketler → formu doldur → hangi
sınıflara gideceğini seç. Anket sonuçlarını yalnızca siz görürsünüz, oylar
anonimdir.
