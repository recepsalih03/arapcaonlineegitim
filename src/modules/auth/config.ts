import type { NextAuthConfig } from "next-auth";

/**
 * Edge'de (middleware) de çalışabilen, veritabanına dokunmayan yapılandırma.
 * Prisma/bcrypt içeren asıl yapılandırma src/modules/auth/index.ts içindedir.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    // Cihaz silindiğinde oturum zaten sunucu tarafında geçersiz kılınıyor;
    // token ömrü yine de sınırlı tutulur.
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // `user` yalnızca giriş anında dolu gelir.
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.role = user.role;
        token.gradeLevel = user.gradeLevel;
        token.mustChangeCredentials = user.mustChangeCredentials;
        token.deviceSessionId = user.deviceSessionId;
        token.rememberMe = user.rememberMe;
        token.loginAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      // DİKKAT: burada veritabanına gidilmez (middleware edge'de çalışıyor).
      // Cihaz/hesap geçerliliği sunucu tarafında requireUser() ile doğrulanır.
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.gradeLevel = token.gradeLevel;
      session.user.mustChangeCredentials = token.mustChangeCredentials;
      session.user.deviceSessionId = token.deviceSessionId;
      session.user.rememberMe = token.rememberMe;
      session.user.loginAt = token.loginAt;
      return session;
    },
  },
} satisfies NextAuthConfig;
