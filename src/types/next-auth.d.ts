import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Oturumda taşınan alanlar.
 *
 * Not: JWT arayüzü "@auth/core/jwt" üzerinden genişletilir — "next-auth/jwt"
 * o modülü yalnızca yeniden dışa aktardığı için oradan yapılan augmentation
 * birleşmiyor.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      gradeLevel: number | null;
      mustChangeCredentials: boolean;
      deviceSessionId: string;
      rememberMe: boolean;
      loginAt: number;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    username: string;
    role: Role;
    gradeLevel: number | null;
    mustChangeCredentials: boolean;
    deviceSessionId: string;
    rememberMe: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    gradeLevel: number | null;
    mustChangeCredentials: boolean;
    deviceSessionId: string;
    rememberMe: boolean;
    /** Girişin yapıldığı an (ms). "Beni hatırla" kapalıysa ömür buna göre kısılır. */
    loginAt: number;
  }
}

export {};
