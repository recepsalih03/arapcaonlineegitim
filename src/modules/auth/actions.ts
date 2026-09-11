"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/modules/auth";
import { signInErrorMessage } from "@/modules/auth/errors";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import {
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/modules/auth/rules";
import { getSessionUser } from "@/modules/auth/session";
import { maxDevices } from "@/modules/devices/service";

export type FormState = { error?: string; success?: string };

/** Giriş formu (PROJE.md §4). Parmak izi istemcide hesaplanıp gizli alanla gelir. */
export async function signInAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await signIn("credentials", {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      fingerprint: String(formData.get("fingerprint") ?? ""),
      // İşaretlenmemiş onay kutusu FormData'ya hiç gelmez.
      rememberMe: formData.get("rememberMe") === "true" ? "true" : "false",
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const code =
        "code" in error && typeof error.code === "string" ? error.code : undefined;
      return { error: signInErrorMessage(code, maxDevices()) };
    }
    throw error;
  }

  // Yönlendirme /panel'e yapılır; oradaki layout rolü ve zorunlu ilk-giriş
  // durumunu görüp admini /yonetim'e, yeni öğrenciyi /ilk-giris'e taşır.
  redirect("/panel");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/giris" });
}

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH, `Kullanıcı adı en az ${USERNAME_MIN_LENGTH} karakter olmalı.`)
  .max(USERNAME_MAX_LENGTH, `Kullanıcı adı en fazla ${USERNAME_MAX_LENGTH} karakter olabilir.`)
  .regex(
    USERNAME_PATTERN,
    "Kullanıcı adı yalnızca küçük harf, rakam, nokta, tire ve alt çizgi içerebilir.",
  );

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`)
  .max(256);

const firstLoginSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Şifreler birbiriyle uyuşmuyor.",
    path: ["passwordConfirm"],
  });

/**
 * Zorunlu ilk giriş (PROJE.md §4b): öğrenci hem kullanıcı adını hem şifresini
 * değiştirmeden başka hiçbir sayfayı göremez.
 */
export async function completeFirstLoginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSessionUser();
  if (!session) return { error: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın." };

  const parsed = firstLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." };
  }

  const { username, password } = parsed.data;

  const current = await prisma.user.findUnique({
    where: { id: session.id },
    select: { username: true, passwordHash: true },
  });
  if (!current) return { error: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın." };

  if (username === current.username) {
    return { error: "Yeni kullanıcı adı, geçici kullanıcı adından farklı olmalı." };
  }
  if (await verifyPassword(password, current.passwordHash)) {
    return { error: "Yeni şifre, geçici şifreden farklı olmalı." };
  }

  const taken = await prisma.user.findFirst({
    where: { username, NOT: { id: session.id } },
    select: { id: true },
  });
  if (taken) return { error: "Bu kullanıcı adı kullanılıyor. Başka bir tane deneyin." };

  await prisma.user.update({
    where: { id: session.id },
    data: {
      username,
      passwordHash: await hashPassword(password),
      mustChangeCredentials: false,
      // Geçici şifre artık geçersiz; admin panelinde de görünmesin.
      initialPassword: null,
    },
  });

  redirect("/panel");
}

const updateCredentialsSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin."),
    username: usernameSchema.optional().or(z.literal("")),
    password: z.union([passwordSchema, z.literal("")]),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === "" || data.password === data.passwordConfirm, {
    message: "Şifreler birbiriyle uyuşmuyor.",
    path: ["passwordConfirm"],
  });

/**
 * Hesap ayarlarından kullanıcı adı/şifre değişimi (PROJE.md §4c).
 * Her iki alan da mevcut şifreyle doğrulanmadan değiştirilemez.
 */
export async function updateCredentialsAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSessionUser();
  if (!session) return { error: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın." };

  const parsed = updateCredentialsSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    username: formData.get("username"),
    password: formData.get("password") ?? "",
    passwordConfirm: formData.get("passwordConfirm") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." };
  }

  const { currentPassword, username, password } = parsed.data;

  const current = await prisma.user.findUnique({
    where: { id: session.id },
    select: { username: true, passwordHash: true },
  });
  if (!current) return { error: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın." };

  if (!(await verifyPassword(currentPassword, current.passwordHash))) {
    return { error: "Mevcut şifreniz hatalı." };
  }

  const data: { username?: string; passwordHash?: string } = {};

  if (username && username !== current.username) {
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: session.id } },
      select: { id: true },
    });
    if (taken) return { error: "Bu kullanıcı adı kullanılıyor. Başka bir tane deneyin." };
    data.username = username;
  }

  if (password) {
    data.passwordHash = await hashPassword(password);
  }

  if (Object.keys(data).length === 0) {
    return { error: "Değiştirmek istediğiniz alanı doldurun." };
  }

  await prisma.user.update({ where: { id: session.id }, data });

  // Kullanıcı adı token'da taşındığı için oturumu tazelemek gerekir; kullanıcı
  // adı değiştiyse en temizi yeniden giriş istemek.
  if (data.username) {
    await signOut({ redirect: false });
    redirect("/giris?bilgi=guncellendi");
  }

  return { success: "Bilgileriniz güncellendi." };
}

/** Oturumun hâlâ geçerli olup olmadığını istemciye bildirmek için. */
export async function currentSessionRole(): Promise<string | null> {
  const session = await auth();
  return session?.user?.role ?? null;
}
