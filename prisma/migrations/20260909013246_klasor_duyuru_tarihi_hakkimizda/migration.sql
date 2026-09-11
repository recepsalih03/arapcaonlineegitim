-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "startsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "folderId" TEXT;

-- DropTable
DROP TABLE "AboutPage";

-- CreateTable
CREATE TABLE "VideoFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoFolder_sortOrder_idx" ON "VideoFolder"("sortOrder");

-- CreateIndex
CREATE INDEX "Announcement_isActive_startsAt_endsAt_idx" ON "Announcement"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Video_folderId_idx" ON "Video"("folderId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "VideoFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

