-- Klasörler artık sınıfa bağlı.
--
-- Klasör bilgisi Video'dan VideoGrade'e taşınıyor: bir video birden fazla
-- sınıfa işaretlenebiliyor ve her sınıfın kendi klasörleri var (6. sınıfın
-- "A Yayınevi" klasörüyle 7. sınıfınki ayrı şeyler).

-- VideoFolder.gradeLevel
-- Var olan klasörler silinmesin diye önce varsayılanla eklenip sonra
-- varsayılan kaldırılıyor; yeni kayıtlar sınıfı açıkça vermek zorunda.
ALTER TABLE "VideoFolder" ADD COLUMN "gradeLevel" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "VideoFolder" ALTER COLUMN "gradeLevel" DROP DEFAULT;

DROP INDEX IF EXISTS "VideoFolder_sortOrder_idx";
CREATE INDEX "VideoFolder_gradeLevel_sortOrder_idx" ON "VideoFolder"("gradeLevel", "sortOrder");

-- Klasör artık video-sınıf eşleşmesinde.
ALTER TABLE "VideoGrade" ADD COLUMN "folderId" TEXT;
CREATE INDEX "VideoGrade_folderId_idx" ON "VideoGrade"("folderId");
ALTER TABLE "VideoGrade" ADD CONSTRAINT "VideoGrade_folderId_fkey"
  FOREIGN KEY ("folderId") REFERENCES "VideoFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Video.folderId artık kullanılmıyor (bu ortamda önceki yarım kalan denemede
-- zaten düşmüştü; IF EXISTS ile temiz kurulumlarda da sorunsuz çalışır).
ALTER TABLE "Video" DROP CONSTRAINT IF EXISTS "Video_folderId_fkey";
DROP INDEX IF EXISTS "Video_folderId_idx";
ALTER TABLE "Video" DROP COLUMN IF EXISTS "folderId";
