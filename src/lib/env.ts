/**
 * Ortam değişkenlerine tek noktadan, tip güvenli erişim.
 *
 * Kural: eksik bir değişken uygulamanın *ilk kullanıldığı anda* anlaşılır bir
 * hata versin — build sırasında değil. Vercel'de build ortamında R2/DB
 * değişkenleri her zaman set olmayabiliyor.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Ortam değişkeni eksik: ${name}. Proje kökündeki .env dosyasına ekleyin (şablon: README.md).`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  r2: {
    get accountId() {
      return required("R2_ACCOUNT_ID");
    },
    get accessKeyId() {
      return required("R2_ACCESS_KEY_ID");
    },
    get secretAccessKey() {
      return required("R2_SECRET_ACCESS_KEY");
    },
    get bucket() {
      return required("R2_BUCKET");
    },
    get endpoint() {
      return (
        process.env.R2_ENDPOINT ||
        `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`
      );
    },
  },
  get maxDevicesPerUser() {
    const parsed = Number.parseInt(optional("MAX_DEVICES_PER_USER", "4"), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
  },
};

/** R2 yapılandırılmış mı? Admin panelinde uyarı göstermek için. */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}
