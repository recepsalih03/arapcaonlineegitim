import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FirstLoginForm } from "@/components/auth/first-login-form";
import { Logo } from "@/components/layout/logo";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "İlk Giriş" };

/**
 * Zorunlu ilk giriş ekranı (PROJE.md §4b). Öğrenci geçici bilgilerini
 * değiştirmeden hiçbir sayfaya geçemez; diğer sayfalar buraya yönlendirir.
 */
export default async function IlkGirisPage() {
  const user = await requireUser();
  if (!user.mustChangeCredentials) {
    redirect(user.role === "ADMIN" ? "/yonetim" : "/panel");
  }

  return (
    <main className="desen-zemin flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hoş geldiniz!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert tone="info">
              Devam etmek için size verilen geçici kullanıcı adı ve şifreyi
              değiştirmeniz gerekiyor. Bu bilgileri kimseyle paylaşmayın.
            </Alert>
            <FirstLoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
