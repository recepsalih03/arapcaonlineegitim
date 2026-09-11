import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Giriş Yap" };

export default async function GirisPage({ searchParams }: PageProps<"/giris">) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/yonetim" : "/panel");
  }

  const params = await searchParams;
  const notice =
    params?.bilgi === "guncellendi"
      ? "Bilgileriniz güncellendi. Yeni kullanıcı adınızla giriş yapın."
      : undefined;

  return (
    <main className="desen-zemin flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Öğrenci Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm notice={notice} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-kum-500">
          <Link href="/" className="hover:text-zumrut-700">
            Ana sayfaya dön
          </Link>
        </p>
      </div>
    </main>
  );
}
