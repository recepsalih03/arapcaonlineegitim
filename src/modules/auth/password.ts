import "server-only";

import bcrypt from "bcryptjs";

/**
 * Şifre işlemleri. Düz şifre hiçbir zaman saklanmaz (PROJE.md §1).
 * Tek istisna: adminin öğrenciye ileteceği *geçici* şifre, öğrenci ilk girişte
 * değiştirene kadar User.initialPassword alanında durur ve değişimde silinir.
 */

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Karıştırılması kolay karakterler (0/O, 1/l/I) bilerek dışarıda bırakıldı —
 * geçici şifre öğrenciye sözlü/yazılı iletileceği için.
 */
const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomString(length: number, alphabet = SAFE_CHARS): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** Geçici şifre: 10 karakter, okunabilir alfabe. */
export function generateTemporaryPassword(): string {
  return randomString(10);
}

/** Geçici kullanıcı adı: "ogr7-4k9m2x" gibi, sınıf bilgisini taşır. */
export function generateTemporaryUsername(gradeLevel: number): string {
  return `ogr${gradeLevel}-${randomString(6, "abcdefghijkmnopqrstuvwxyz23456789")}`;
}
