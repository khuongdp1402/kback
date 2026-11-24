-- Add composite indexes for hot wallet, transaction, payout, and click queries
CREATE INDEX IF NOT EXISTS "Click_userId_createdAt_idx" ON "Click"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_userId_status_idx" ON "Transaction"("userId", "status");
CREATE INDEX IF NOT EXISTS "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PayoutRequest_userId_status_idx" ON "PayoutRequest"("userId", "status");
CREATE INDEX IF NOT EXISTS "PayoutRequest_userId_createdAt_idx" ON "PayoutRequest"("userId", "createdAt");
