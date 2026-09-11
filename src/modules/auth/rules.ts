/**
 * Kullanıcı adı / şifre kuralları.
 *
 * Bilerek ayrı bir dosyada: hem sunucudaki doğrulama hem de istemcideki form
 * ipuçları aynı değerleri kullanmalı, ama istemci bcrypt içeren server-only
 * password.ts'i çekemez.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 32;

/** Küçük harf, rakam, alt çizgi, nokta ve tire. Türkçe karaktere izin verilmez. */
export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
