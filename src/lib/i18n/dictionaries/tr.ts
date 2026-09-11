/**
 * Türkçe sözlük — referans dil. Diğer diller bunun şeklini takip eder.
 * Bilerek `as const` YOK: değerler `string` olarak genişlesin ki Arapça sözlük
 * aynı anahtarlara farklı metin yazabilsin.
 */
export const tr = {
  app: {
    name: "Online Arapça Özel Ders",
    tagline: "Sınıf seviyene özel Arapça dersleri",
  },
  nav: {
    home: "Ana Sayfa",
    about: "Hakkımızda",
    login: "Giriş Yap",
    logout: "Çıkış Yap",
    panel: "Panelim",
    admin: "Yönetim",
    videos: "Videolar",
    announcements: "Duyurular",
    surveys: "Anketler",
    account: "Hesabım",
    students: "Öğrenciler",
    overview: "Genel Bakış",
  },
  auth: {
    username: "Kullanıcı adı",
    password: "Şifre",
    newPassword: "Yeni şifre",
    newPasswordAgain: "Yeni şifre (tekrar)",
    currentPassword: "Mevcut şifre",
    signIn: "Giriş yap",
    signingIn: "Giriş yapılıyor…",
    invalidCredentials: "Kullanıcı adı veya şifre hatalı.",
    accountDisabled: "Bu hesap pasif durumda. Lütfen öğretmeninizle iletişime geçin.",
    deviceLimitReached:
      "Bu hesap en fazla {max} cihazdan kullanılabilir. Yeni bir cihaz eklemek için hesap ayarlarından bir cihazı silin.",
  },
  devices: {
    title: "Cihazlarım",
    thisDevice: "Bu cihaz",
    lastSeen: "Son giriş",
    remove: "Cihazı sil",
    removed: "Cihaz silindi.",
    cannotRemoveCurrent: "Şu an kullandığınız cihazı silemezsiniz.",
    limitNote:
      "Hesabınız en fazla {max} cihazdan kullanılabilir. Cihaz ayrımı tarayıcı parmak izine göre yapılır ve %100 kesin değildir.",
  },
  common: {
    save: "Kaydet",
    saving: "Kaydediliyor…",
    cancel: "Vazgeç",
    delete: "Sil",
    edit: "Düzenle",
    create: "Oluştur",
    back: "Geri",
    empty: "Henüz kayıt yok.",
    error: "Bir hata oluştu.",
    confirm: "Emin misiniz?",
  },
};

export type Dictionary = typeof tr;
