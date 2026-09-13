import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Hakkımızda" };

/**
 * Hakkımızda sayfası. İçerik (biyografi metni ve fotoğraf) site sahibi
 * tarafından verildi ve doğrudan buraya gömülü; panelden düzenlenen bir alan
 * istenmedi, o yüzden veritabanı kaydı yok.
 */

// Metni tek yerde tutup paragraf paragraf basıyoruz.
const PARAGRAFLAR = [
  "1997 yılında İstanbul'da doğdum. Lise öğrenimimi İstanbul Anadolu İmam Hatip Lisesi'nde (RTE Anadolu İHL) tamamladıktan sonra Marmara Üniversitesi İlahiyat Fakültesini kazandım. Ardından Marmara Üniversitesi İlahiyat Fakültesi Tasavvuf Anabilim Dalında “Ali b. Hicâzî el-Beyyûmî” hakkında yüksek lisans tezimi savundum.",
  "7 yıldır çocuklara ve yetişkinlere aktif olarak Arapça ve Kur'ân-ı Kerîm dersi vermekteyim. Aynı zamanda çeşitli noterliklerde yeminli tercümanlık yaparken, dijital platformlar üzerinden öğrencilerimizin bu dildeki zorluklarını aşması için çalışıyorum.",
  "Amacım; öğrencilerimizin Arapça ve Kur'ân-ı Kerîm'i öğrenme sürecinde onlara rehberlik etmek, evdeki ders kaosunu bitirmek ve bu dili onlara en kalıcı şekilde sevdirmektir :)",
];

export default function HakkimizdaPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-zumrut-900 sm:text-3xl">
          Hakkımızda
        </h1>

        {/* Fotoğraf: ortada, süslü çerçeveli. Marka dili — zümrüt geçişli zemin,
            üzerine durağan altın rub el-hizb (sekiz kollu yıldız) dokusu ve
            altın iç kenar. */}
        <div className="mt-10 flex justify-center">
          {/* Dış çerçeve: zümrüt geçiş + durağan altın yıldız dokusu. */}
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-zumrut-600 via-zumrut-700 to-zumrut-800 p-5 shadow-xl sm:p-6">
            <span className="yildiz-dokusu-altin absolute inset-0" aria-hidden />

            {/* Altın iç kenar: fotoğrafı saran ince altın çerçeve. */}
            <span
              className="relative block rounded-[1.4rem] p-[3px] shadow-inner"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-altin-200), var(--color-altin-400) 55%, var(--color-altin-600))",
              }}
            >
              {/* Tek statik portre; proje genelinde next/image kullanılmıyor. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hakkinda_foto.jpeg"
                alt="Musa Kahraman"
                width={256}
                height={256}
                className="block size-56 rounded-[1.25rem] object-cover sm:size-64"
              />
            </span>
          </div>
        </div>

        <div className="mt-12 space-y-4 text-[15px] leading-relaxed text-kum-700">
          <p className="text-lg font-medium text-zumrut-900">
            Herkese merhaba, ben Musa Kahraman.
          </p>
          {PARAGRAFLAR.map((paragraf) => (
            <p key={paragraf.slice(0, 24)}>{paragraf}</p>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
