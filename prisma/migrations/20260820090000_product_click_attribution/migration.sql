-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "clickId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_clickId_key" ON "Product"("clickId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "Click"("id") ON DELETE SET NULL ON UPDATE CASCADE;
