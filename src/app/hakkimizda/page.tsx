import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Hakkımızda" };

/**
 * Hakkımızda sayfası.
 *
 * İçerik şimdilik bilerek boş: metin site sahibi tarafından verilecek ve
 * doğrudan buraya yazılacak. Panelden düzenlenen bir alan istenmedi, o yüzden
 * ne veritabanı kaydı ne de yönetim ekranı var.
 */
export default function HakkimizdaPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zumrut-900">
          Hakkımızda
        </h1>
      </main>
      <SiteFooter />
    </>
  );
}
