-- Fix drift: schema.prisma has `passwordHash String?` (Google and Zalo accounts have no
-- password), but the init migration created the column NOT NULL — so on any database built
-- purely from migrations (fresh Docker/local DB), Google/Zalo sign-up failed with P2011.
-- Safe on databases where the column is already nullable (DROP NOT NULL is a no-op there).

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
