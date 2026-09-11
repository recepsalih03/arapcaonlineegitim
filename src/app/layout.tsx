import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { SITE_URL } from "@/lib/constants";
import { DEFAULT_LOCALE, directionOf, getDictionary } from "@/lib/i18n";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const dictionary = getDictionary(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: {
    default: dictionary.app.name,
    template: `%s · ${dictionary.app.name}`,
  },
  description:
    "5, 6, 7 ve 8. sınıflar için online Arapça özel ders platformu. Sınıf seviyene özel ders videoları, duyurular ve anketler.",
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#174435",
  width: "device-width",
  initialScale: 1,
  // Mobilde metin okunabilirliği için kullanıcı yakınlaştırması engellenmez.
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={directionOf(DEFAULT_LOCALE)}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-kum-50">{children}</body>
    </html>
  );
}
