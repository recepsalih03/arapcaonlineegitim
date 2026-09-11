import "server-only";

import type { DeviceSession } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Cihaz/oturum yönetimi (PROJE.md §5).
 *
 * Bir hesap en fazla MAX_DEVICES_PER_USER (varsayılan 4) *aktif* cihazdan
 * kullanılabilir. Cihaz ayrımı tarayıcı parmak izine dayanır ve bilinçli olarak
 * "en iyi çaba"dır: aynı bilgisayarda farklı tarayıcı ayrı cihaz sayılabilir,
 * tarayıcı güncellemesi parmak izini değiştirebilir. Bu kabul edilmiş bir
 * sınırdır (PROJE.md §12.2) — bu yüzden öğrenci kendi cihazlarını silebiliyor
 * ve admin gerektiğinde hepsini sıfırlayabiliyor.
 */

export type DeviceRegistrationResult =
  | { ok: true; session: DeviceSession }
  | { ok: false; reason: "device_limit"; activeCount: number; max: number };

export function maxDevices(): number {
  return env.maxDevicesPerUser;
}

export async function countActiveDevices(userId: string): Promise<number> {
  return prisma.deviceSession.count({ where: { userId, isActive: true } });
}

export async function listDevices(userId: string): Promise<DeviceSession[]> {
  return prisma.deviceSession.findMany({
    where: { userId, isActive: true },
    orderBy: { lastSeenAt: "desc" },
  });
}

/**
 * Giriş anında çağrılır. Cihaz tanınıyorsa oturumu tazeler; tanınmıyorsa
 * limit dolu değilse yeni kayıt açar, doluysa girişi reddeder.
 *
 * Daha önce silinmiş (isActive=false) bir cihazdan tekrar giriş yapılırsa
 * kayıt yeniden aktifleştirilir ve limite yeniden dahil olur.
 */
export async function registerDevice(params: {
  userId: string;
  fingerprint: string;
  deviceLabel: string;
  userAgent: string | null;
  ipHint: string | null;
}): Promise<DeviceRegistrationResult> {
  const { userId, fingerprint, deviceLabel, userAgent, ipHint } = params;
  const max = maxDevices();

  const existing = await prisma.deviceSession.findUnique({
    where: { userId_fingerprint: { userId, fingerprint } },
  });

  if (existing?.isActive) {
    const session = await prisma.deviceSession.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date(), deviceLabel, userAgent, ipHint },
    });
    return { ok: true, session };
  }

  const activeCount = await countActiveDevices(userId);
  if (activeCount >= max) {
    return { ok: false, reason: "device_limit", activeCount, max };
  }

  if (existing) {
    const session = await prisma.deviceSession.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        lastSeenAt: new Date(),
        deviceLabel,
        userAgent,
        ipHint,
      },
    });
    return { ok: true, session };
  }

  const session = await prisma.deviceSession.create({
    data: { userId, fingerprint, deviceLabel, userAgent, ipHint },
  });
  return { ok: true, session };
}

/** Oturum hâlâ geçerli mi? Cihaz silinmişse token elde kalsa bile false döner. */
export async function isDeviceSessionValid(
  deviceSessionId: string,
  userId: string,
): Promise<boolean> {
  const found = await prisma.deviceSession.findFirst({
    where: { id: deviceSessionId, userId, isActive: true },
    select: { id: true },
  });
  return found !== null;
}

/** Son görülme zamanını tazeler. Her istekte değil, seyrek çağrılır. */
export async function touchDeviceSession(deviceSessionId: string): Promise<void> {
  await prisma.deviceSession
    .update({
      where: { id: deviceSessionId },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {
      // Cihaz bu arada silinmiş olabilir; oturum doğrulaması zaten yakalar.
    });
}

/**
 * Cihazı pasife alır. Öğrenci şu an kullandığı cihazı silemez (PROJE.md §5d);
 * bu kontrol currentDeviceSessionId ile burada zorlanır.
 */
export async function removeDevice(params: {
  userId: string;
  deviceSessionId: string;
  currentDeviceSessionId: string | null;
}): Promise<{ ok: true } | { ok: false; reason: "current_device" | "not_found" }> {
  const { userId, deviceSessionId, currentDeviceSessionId } = params;

  if (currentDeviceSessionId && deviceSessionId === currentDeviceSessionId) {
    return { ok: false, reason: "current_device" };
  }

  const found = await prisma.deviceSession.findFirst({
    where: { id: deviceSessionId, userId, isActive: true },
    select: { id: true },
  });
  if (!found) return { ok: false, reason: "not_found" };

  await prisma.deviceSession.update({
    where: { id: found.id },
    data: { isActive: false },
  });
  return { ok: true };
}

/**
 * Adminin destek amaçlı kullandığı toplu sıfırlama (PROJE.md §12.2 kararı):
 * parmak izi kayması yüzünden kilitlenen öğrencinin tüm cihazlarını düşürür.
 */
export async function resetAllDevices(userId: string): Promise<number> {
  const result = await prisma.deviceSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  return result.count;
}
