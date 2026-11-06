-- AlterTable
ALTER TABLE "GeneratedVideo" DROP COLUMN "voiceScript",
DROP COLUMN "voiceId",
ADD COLUMN     "musicUrl" TEXT;
