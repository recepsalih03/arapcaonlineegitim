import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { auth } from "@/modules/auth";

/**
 * Oturum doğrulama. Token'daki bilgiye körü körüne güvenilmez; her istekte
 * veritabanından tazelenir çünkü:
 *   - admin öğrenciyi pasife almış olabilir,
 *   - öğrencinin cihazı silinmiş olabilir (oturum düşmeli, PROJE.md §5e),
 *   - sınıf seviyesi değişmiş olabilir.
 * React `cache` sayesinde bu sorgu istek başına bir kez çalışır.
 */

export type SessionUser = {
  id: string;
  username: string;
  fullName: string | null;
  role: Role;
  gradeLevel: number | null;
  mustChangeCredentials: boolean;
  deviceSessionId: string;
};

/**
 * "Beni hatırla" kapalıyken oturumun yaşayacağı süre.
 *
 * Çerez ömrü Auth.js'te tek bir sabitten geliyor ve girişe göre
 * değiştirilemiyor. Bu yüzden kısıtı burada, her istekte uyguluyoruz: token
 * elde kalsa bile bu süre dolmuşsa oturum yok sayılır. Ortak bilgisayarda
 * kalıcı giriş bırakmamak için gerekli.
 */
const HATIRLAMA_KAPALI_OMUR_MS = 12 * 60 * 60 * 1000;

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const tokenUser = session?.user;
  if (!tokenUser?.id || !tokenUser.deviceSessionId) return null;

  if (
    tokenUser.rememberMe === false &&
    typeof tokenUser.loginAt === "number" &&
    Date.now() - tokenUser.loginAt > HATIRLAMA_KAPALI_OMUR_MS
  ) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: tokenUser.id, isActive: true },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      gradeLevel: true,
      mustChangeCredentials: true,
      devices: {
        where: { id: tokenUser.deviceSessionId, isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) return null;
  // Cihaz silinmişse token hâlâ geçerli görünse bile oturum yok sayılır.
  if (user.devices.length === 0) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    gradeLevel: user.gradeLevel,
    mustChangeCredentials: user.mustChangeCredentials,
    deviceSessionId: tokenUser.deviceSessionId,
  };
});

/** Giriş şart; yoksa giriş sayfasına yönlendirir. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/giris");
  return user;
}

/**
 * Girişli + zorunlu ilk-giriş akışını tamamlamış kullanıcı (PROJE.md §4b).
 * Bilgilerini değiştirmemiş öğrenci başka hiçbir sayfayı göremez.
 */
export async function requireOnboardedUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.mustChangeCredentials) redirect("/ilk-giris");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireOnboardedUser();
  if (user.role !== "ADMIN") redirect("/panel");
  return user;
}

export async function requireStudent(): Promise<
  SessionUser & { gradeLevel: number }
> {
  const user = await requireOnboardedUser();
  if (user.role !== "STUDENT" || user.gradeLevel === null) {
    redirect(user.role === "ADMIN" ? "/yonetim" : "/giris");
  }
  return user as SessionUser & { gradeLevel: number };
}

/** API route'ları için: yönlendirme yerine null döner. */
export async function getAuthorizedUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.mustChangeCredentials) return null;
  return user;
}
