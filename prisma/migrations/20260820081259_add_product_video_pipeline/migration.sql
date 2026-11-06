-- CreateEnum
CREATE TYPE "ProductImageSource" AS ENUM ('UPLOADED', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'GENERATING_MODEL_IMAGE', 'GENERATING_CLIPS', 'RENDERING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "imageSource" "ProductImageSource" NOT NULL DEFAULT 'UPLOADED',
    "sourceUrl" TEXT NOT NULL,
    "affiliateDeepLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedVideo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "durationSeconds" INTEGER NOT NULL DEFAULT 10,
    "modelImageUrl" TEXT,
    "voiceScript" TEXT,
    "voiceId" TEXT,
    "errorMessage" TEXT,
    "finalVideoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoClip" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "externalTaskId" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "clipUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoClip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoClip_externalTaskId_key" ON "VideoClip"("externalTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoClip_videoId_sequence_key" ON "VideoClip"("videoId", "sequence");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedVideo" ADD CONSTRAINT "GeneratedVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoClip" ADD CONSTRAINT "VideoClip_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "GeneratedVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
