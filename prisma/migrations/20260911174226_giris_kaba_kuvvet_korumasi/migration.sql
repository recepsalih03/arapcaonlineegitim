-- Giriş için kaba kuvvet (brute-force) koruması.
-- İki alan da varsayılanlı/nullable: dolu tabloya güvenle eklenir, mevcut
-- satırlar failedLoginCount=0, lockedUntil=NULL ile başlar.
ALTER TABLE "User" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);
