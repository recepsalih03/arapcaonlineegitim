-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('BOSLUK', 'KART', 'ESLESTIRME', 'BULMACA');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GameType" NOT NULL,
    "content" JSONB NOT NULL,
    "isArabic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameGrade" (
    "gameId" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,

    CONSTRAINT "GameGrade_pkey" PRIMARY KEY ("gameId","gradeLevel")
);

-- CreateIndex
CREATE INDEX "Game_isActive_sortOrder_idx" ON "Game"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "GameGrade_gradeLevel_idx" ON "GameGrade"("gradeLevel");

-- AddForeignKey
ALTER TABLE "GameGrade" ADD CONSTRAINT "GameGrade_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

