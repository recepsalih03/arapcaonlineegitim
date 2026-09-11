import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/modules/auth/config";
import { SIGN_IN_ERROR_CODES, SignInFailure } from "@/modules/auth/errors";
import { verifyPassword } from "@/modules/auth/password";
import { coarseIp, deviceLabelFromUserAgent } from "@/modules/devices/labels";
import { registerDevice } from "@/modules/devices/service";

/**
 * Auth.js (NextAuth v5) — credentials provider (PROJE.md §1).
 *
 * Giriş akışında iki şey birlikte doğrulanır:
 *   1) kullanıcı adı + şifre,
 *   2) cihaz limiti (parmak izi ile, PROJE.md §5).
 * İkincisi başarısızsa şifre doğru olsa bile giriş reddedilir.
 */

const credentialsSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
  fingerprint: z.string().min(8).max(256),
  /** "Beni hatırla" işaretli mi? Oturumun ne kadar yaşayacağını belirler. */
  rememberMe: z.union([z.literal("true"), z.literal("false")]).optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Kullanıcı adı", type: "text" },
        password: { label: "Şifre", type: "password" },
        fingerprint: { label: "Cihaz kimliği", type: "text" },
        rememberMe: { label: "Beni hatırla", type: "text" },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          // Parmak izi hesaplanamamışsa kullanıcıya ayrı mesaj göster.
          const fingerprintFailed = parsed.error.issues.some((issue) =>
            issue.path.includes("fingerprint"),
          );
          throw new SignInFailure(
            fingerprintFailed
              ? SIGN_IN_ERROR_CODES.missingFingerprint
              : SIGN_IN_ERROR_CODES.invalidCredentials,
          );
        }

        const { username, password, fingerprint } = parsed.data;
        const rememberMe = parsed.data.rememberMe === "true";

        const user = await prisma.user.findUnique({
          where: { username: username.trim().toLowerCase() },
        });

        // Kullanıcı yoksa da şifreyi doğrularmış gibi zaman harcamak yerine
        // sabit mesaj döneriz; kullanıcı adı sayımı (enumeration) bu yüzden
        // zamanlamadan da okunmasın diye bcrypt karşılaştırması yine yapılır.
        const passwordOk = user
          ? await verifyPassword(password, user.passwordHash)
          : await verifyPassword(password, DUMMY_HASH).then(() => false);

        if (!user || !passwordOk) {
          throw new SignInFailure(SIGN_IN_ERROR_CODES.invalidCredentials);
        }

        if (!user.isActive) {
          throw new SignInFailure(SIGN_IN_ERROR_CODES.accountDisabled);
        }

        const userAgent = request?.headers?.get("user-agent") ?? null;
        const forwardedFor = request?.headers?.get("x-forwarded-for") ?? null;

        const registration = await registerDevice({
          userId: user.id,
          fingerprint,
          deviceLabel: deviceLabelFromUserAgent(userAgent),
          userAgent,
          ipHint: coarseIp(forwardedFor),
        });

        if (!registration.ok) {
          throw new SignInFailure(SIGN_IN_ERROR_CODES.deviceLimit);
        }

        return {
          id: user.id,
          username: user.username,
          name: user.fullName ?? user.username,
          role: user.role,
          gradeLevel: user.gradeLevel,
          mustChangeCredentials: user.mustChangeCredentials,
          deviceSessionId: registration.session.id,
          rememberMe,
        };
      },
    }),
  ],
});

/**
 * Var olmayan kullanıcıda da bcrypt maliyeti ödensin diye kullanılan sabit hash
 * ("gecersiz" kelimesinin hash'i). Zamanlama farkından kullanıcı adı sızmasın.
 */
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO3JqBQ8VjPQ8gW1zJb7lM0kSN2eEXn3W";
