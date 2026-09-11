import { CredentialsSignin } from "next-auth";

/**
 * Giriş hataları. Kod, Auth.js tarafından URL'e yazıldığı için hassas bilgi
 * içermez; kullanıcıya gösterilen Türkçe metin istemci tarafında koddan üretilir.
 */
export const SIGN_IN_ERROR_CODES = {
  invalidCredentials: "gecersiz_bilgi",
  accountDisabled: "hesap_pasif",
  deviceLimit: "cihaz_limiti",
  missingFingerprint: "cihaz_kimligi_yok",
  tooManyAttempts: "cok_fazla_deneme",
} as const;

export type SignInErrorCode =
  (typeof SIGN_IN_ERROR_CODES)[keyof typeof SIGN_IN_ERROR_CODES];

export class SignInFailure extends CredentialsSignin {
  constructor(public code: SignInErrorCode) {
    super(code);
  }
}

/** Kod → kullanıcıya gösterilecek Türkçe metin. */
export function signInErrorMessage(
  code: string | undefined | null,
  maxDevices: number,
): string {
  switch (code) {
    case SIGN_IN_ERROR_CODES.accountDisabled:
      return "Bu hesap pasif durumda. Lütfen öğretmeninizle iletişime geçin.";
    case SIGN_IN_ERROR_CODES.deviceLimit:
      return `Bu hesap en fazla ${maxDevices} cihazdan kullanılabilir. Yeni bir cihaz eklemek için kullandığınız cihazlardan birinde "Hesabım" sayfasından bir cihazı silin.`;
    case SIGN_IN_ERROR_CODES.missingFingerprint:
      return "Cihazınız tanınamadı. Tarayıcınızı yenileyip tekrar deneyin.";
    case SIGN_IN_ERROR_CODES.tooManyAttempts:
      return "Çok fazla hatalı giriş denemesi yapıldı. Güvenlik için kısa bir süre bekleyip tekrar deneyin.";
    case SIGN_IN_ERROR_CODES.invalidCredentials:
      return "Kullanıcı adı veya şifre hatalı.";
    default:
      return "Giriş yapılamadı. Lütfen tekrar deneyin.";
  }
}
