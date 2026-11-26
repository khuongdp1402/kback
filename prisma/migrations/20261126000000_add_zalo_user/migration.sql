-- AlterTable
ALTER TABLE "User" ADD COLUMN     "zaloUserId" TEXT,
ADD COLUMN     "avatarUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_zaloUserId_key" ON "User"("zaloUserId");
