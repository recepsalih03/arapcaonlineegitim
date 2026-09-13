/** Sade alt bilgi. İstenmeyen sayfalara (KVKK vb.) link yok (PROJE.md §13). */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-kum-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-kum-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Online Arapça Özel Ders</p>
      </div>
    </footer>
  );
}
