# Online Arapça Özel Ders Platformu — Proje Şartnamesi

Bu dosya Claude Code'a verilecektir. Amaç: sıfırdan, modüler, mobil öncelikli bir online ders platformu kurmak. Bu doküman ne yapılacağını ve mimariyi net tanımlar. Kod yazarken bu şartnameye sadık kal, belirsiz kalan yerde varsayım yapmadan sor.

Domain: `www.onlinearapcaozelders.com`
Arayüz dili: Türkçe (ileride oyun modülünde Arapça/RTL devreye girecek, o yüzden i18n altyapısı baştan hazır kurulsun).

---

## 1. Teknoloji Yığını (kesinleşmiş)

| Katman | Seçim | Not |
|---|---|---|
| Framework | **Next.js** (App Router, TypeScript) | Modüler yapı zorunlu |
| Hosting | **Vercel** (Hobby) | Site üzerinden ödeme alınmıyor |
| Veritabanı | **Neon** (PostgreSQL, ücretsiz katman) | ORM: **Prisma** |
| Video depolama | **Cloudflare R2** | Egress ücretsiz |
| Auth | **Auth.js (NextAuth v5)** — credentials provider | Kullanıcı adı + şifre |
| Şifre hash | **bcrypt** / argon2 | Düz şifre asla saklanmaz |
| UI | **Tailwind CSS** + **shadcn/ui** | Sade, şık, İslami tema |
| Cihaz parmak izi | **@fingerprintjs/fingerprintjs** (open-source sürüm) | En iyi çaba |
| Video oynatıcı | **hls.js** + custom player | İndirme/sağ tık engelli |

### Önemli mimari kuralı — video akışı
- Videolar **hiçbir zaman Vercel üstünden geçmez.** Vercel Hobby fonksiyon limitlerine takılmamak için:
  - **Yükleme:** Admin panelden video yüklerken tarayıcı, Vercel'den alınan **presigned URL** ile dosyayı **doğrudan R2'ye** yükler. Büyük dosya Vercel'e uğramaz.
  - **İzleme:** Video, R2'den **HLS** (parçalı `.m3u8` + `.ts`) olarak akar. Next.js sadece "bu kullanıcı bu videoya erişebilir mi" kontrolünü yapıp **kısa ömürlü imzalı URL** (birkaç dk) üretir.
- **Transcoding/HLS'e çevirme:** Yüklenen ham video HLS'e çevrilmeli. Vercel'de ağır işlem yapılamaz; bu iş için bir seçenek belirlenmeli (aşağıda "Açık Karar" bölümü).

---

## 2. Video Koruma (indirilemezlik) — "kodla yapılabilenin en iyisi"

Gerçek DRM (Widevine/FairPlay) YOK. Netflix seviyesi beklenmiyor. Kod tarafında şu caydırıcı katmanlar uygulanacak:

a) Video **HLS** ile parça parça servis edilir; tek bir indirilebilir dosya linki yoktur.
b) `.m3u8` ve segment linkleri **imzalı ve süreli** (expiring signed URL, ~birkaç dk) olur.
c) Her oynatma isteğinde backend **kullanıcı yetkisi + cihaz oturumu** doğrular; token üretir.
d) Player: sağ tık engeli, `controlsList="nodownload"`, video src'nin DOM'da açık durmaması.
e) R2 bucket'ı **public değildir**; sadece imzalı isteklerle erişilir.

Not (dosyada açıkça belirt): Ekran kaydı bu yöntemlerle engellenemez, bu beklenti dışıdır.

---

## 3. Kullanıcı Rolleri

- **Admin** (tek kişi — site sahibi/öğretmen): her şeye yetkili.
- **Öğrenci**: sadece kendi sınıf seviyesindeki içeriğe erişir.
- **Ziyaretçi (public)**: sadece "public" işaretli örnek videoyu linkle, girişsiz izleyebilir.

Sınıf seviyeleri: **5, 6, 7, 8, 9**.

---

## 4. Öğrenci Hesap Akışı

a) Admin panelde her sınıf panelinde **"Yeni Öğrenci Oluştur"** butonu var. Tıklayınca sistem veritabanında yeni bir öğrenci için **geçici kullanıcı adı + geçici şifre** üretir (admin bunları öğrenciye iletir).
b) Öğrenci **ilk girişte** kullanıcı adı ve şifresini değiştirmek **zorundadır** (zorunlu ilk-giriş akışı).
c) Öğrenci sonradan hesap ayarlarından, **mevcut şifresiyle doğrulayarak** kullanıcı adı/şifresini değiştirebilir.
d) Admin bir öğrenciyi istediği zaman **silebilir / pasife alabilir**.

---

## 5. Cihaz Yönetimi (4 fiziksel cihaz limiti)

a) Bir hesap **en fazla 4 fiziksel cihazdan** giriş yapabilir. Cihaz ayrımı **fingerprint (parmak izi)** ile yapılır — %100 kesin değil, "en iyi çaba" olarak uygulanır ve dosyada böyle belirtilir.
b) 4 cihaz doluyken 5. cihazdan giriş **reddedilir**; kullanıcıya "önce bir cihaz silin" mesajı gösterilir.
c) Öğrenci hesap ayarlarında **giriş yapılmış cihazların listesini** görür (cihaz adı/tarayıcı, son giriş tarihi, IP kabası).
d) Öğrenci **şu an kullandığı cihaz hariç** istediği cihazı silebilir (o cihazın oturumu sonlanır).
e) Her cihaz için bir **oturum (session) kaydı** DB'de tutulur; cihaz silinince session invalid olur.

---

## 6. İçerik ve Erişim Kuralları

### Videolar
a) Admin yeni video eklerken **hangi sınıf seviyeleri için** olduğunu işaretler. **Birden fazla sınıf** seçilebilir (many-to-many).
b) Öğrenci **yalnızca kendi sınıf seviyesindeki** videolara erişir.
c) Videolar indirilemez (bkz. Bölüm 2).

### Public örnek video
d) Admin herhangi bir videoyu **"public"** yapabilir → girişsiz, linkle erişilir.
e) **Her sınıf seviyesi için aynı anda en fazla 1 public video** olabilir. Aynı sınıfta yeni bir video public yapılırsa **eskisi otomatik pasife alınır** (yanlış işaretlemeye karşı koruma). Bu kural backend'de zorlanır.

---

## 7. Admin Paneli

### Panel yapısı
- Her sınıf (5,6,7,8,9) için **ayrı bir panel görünümü** + bir **genel panel** (tüm sınıfların özeti).
- Her sınıf panelinde: o sınıfın öğrencileri, videoları, duyuruları, anketleri.

### Öğrenci yönetimi
- Yeni öğrenci oluştur / sil / pasife al (Bölüm 4).
- Öğrenci cihazlarını görebilme (destek amaçlı).

### Video yönetimi
- Video yükle (doğrudan R2'ye presigned upload), başlık/açıklama, sınıf seviyesi işaretleme (çoklu), public yapma toggle'ı (sınıf başına 1 kısıtı).

### Duyuru paneli
- Duyuru oluştur; **hangi sınıf seviyelerine** gideceğini seç (**çoklu seçim**).
- Öğrenci kendi paneline düşen duyuruları görür.

### Anket paneli
- Anket oluştur (soru + seçenekler); **hangi sınıflara** gideceğini seç (**çoklu seçim**).
- Anket **anonimdir** — kimin ne oyladığı tutulmaz, sadece sayaç artar.
- Sonuçları **yalnızca admin** görür (panelde döküm/oran).

### Hakkımızda
- Basit bir **Hakkımızda** sayfası; içeriği admin sonradan girecek (şimdilik placeholder, düzenlenebilir alan).

---

## 8. Mobil Öncelik (kritik)

Kullanıcıların çoğu **telefondan** girecek. Bu yüzden:
- Tasarım **mobile-first** yapılır, sonra masaüstüne genişletilir.
- Dokunmatik hedefler büyük, menüler tek elle erişilebilir, video oynatıcı mobilde tam ekran uyumlu.
- Ağır animasyon/şatafat yok; hızlı ve akıcı.

---

## 9. Tasarım / Tema

- **Sade ve ŞIK.** Aşırı süs yok.
- Hafif **İslami renk teması**: yeşil tonları (zümrüt/çam yeşili), altın/bej vurgular, ferah beyaz zemin. İstenirse ince geometrik (İslami desen) motifler arka planda düşük opaklıkta.
- Hazır UI temeli olarak **shadcn/ui** + Tailwind kullanılabilir; ekstra hazır tema/komponent repo'su entegre edilebilir (sade kalmak şartıyla).

---

## 10. Modülerlik (kritik)

- Kod **modüler** yazılır: her ana alan (auth, cihaz yönetimi, video, duyuru, anket, admin, public) ayrı modül/klasör.
- İleride eklenecek **Duolingo tarzı oyun modülü** için yer bırakılır (route ve klasör iskeleti hazır ama içi boş). **Şimdilik oyun kısmı YAPILMAYACAK** — önce yukarıdaki her şey bitecek.

---

## 11. Veri Modeli (Prisma taslağı — Claude Code detaylandırsın)

- **User**: id, username, passwordHash, role (admin/student), gradeLevel (öğrenci için), mustChangeCredentials (bool), isActive, createdAt.
- **Device/Session**: id, userId, fingerprint, deviceLabel, lastSeenAt, createdAt, isActive. (Kullanıcı başına aktif max 4.)
- **Video**: id, title, description, r2Key/hlsPath, isPublic, createdAt.
- **VideoGrade** (many-to-many): videoId, gradeLevel.
- **Announcement**: id, title, body, createdAt.
- **AnnouncementGrade** (m2m): announcementId, gradeLevel.
- **Survey**: id, question, options(json), createdAt.
- **SurveyGrade** (m2m): surveyId, gradeLevel.
- **SurveyVote**: id, surveyId, optionIndex — **anonim** (userId TUTULMAZ; ama aynı kullanıcının iki kez oy vermesini engellemek için ayrı bir "hasVoted" işareti gerekirse, oy içeriğinden bağımsız tutulur).
- **AboutPage**: id, contentHtml (admin düzenler).

Not: Public video kısıtı (sınıf başına 1) uygulama seviyesinde zorlanır.

---

## 12. Açık Kararlar (Claude Code başlamadan önce netleştirilecek)

1. **HLS transcoding nerede yapılacak?** Vercel'de ağır ffmpeg işi çalışmaz. Seçenekler:
   - (a) Cloudflare Stream'e geçmek (ama R2 tercih edildi),
   - (b) videoyu admin kendi bilgisayarında ffmpeg ile HLS'e çevirip öyle yüklemek (en ucuz, kod sadeleşir),
   - (c) ayrı bir küçük worker/servis (örn. bir job) ile sunucu tarafında çevirmek.
   → **Öneri: (b)** en ucuz ve en az bağımlılık. Karar bekleniyor.

2. Fingerprint kütüphanesinin ücretsiz sürümünün doğruluğu sınırlıdır; "aynı cihaz farklı tarayıcı" durumunda ayrı cihaz sayılabilir. Kabul ediliyor mu?

---

## 13. Yapılmayacaklar (kapsam dışı — şimdilik)

- Duolingo tarzı oyun modülü (sonraki faz).
- Gerçek DRM.
- Site üzerinden ödeme.
- İletişim/KVKK/gizlilik sayfaları (istenmedi).

---

## 14. Geliştirme Sırası (önerilen)

1. Proje iskeleti + Prisma şeması + Neon bağlantısı.
2. Auth (credentials) + zorunlu ilk-giriş akışı.
3. Cihaz/oturum yönetimi + 4 cihaz limiti + cihaz silme.
4. Admin paneli iskeleti (sınıf panelleri + genel panel).
5. Video yükleme (R2 presigned) + HLS oynatma + erişim kontrolü.
6. Public video + sınıf başına 1 kısıtı.
7. Duyuru modülü.
8. Anket modülü (anonim) + admin sonuç görünümü.
9. Hakkımızda (düzenlenebilir).
10. Mobil UI cilası + tema.
11. (Sonraki faz) Oyun modülü iskeleti.
