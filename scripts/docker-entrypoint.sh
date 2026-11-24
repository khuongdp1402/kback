#!/bin/sh
set -e

echo "==> [1/3] Áp dụng Prisma migrations lên PostgreSQL nội bộ..."
npx prisma migrate deploy

echo "==> [2/3] Nạp dữ liệu mặc định (Shops & tài khoản demo/admin, idempotent)..."
npx tsx prisma/seed.ts || echo "Seed skipped or already populated."

echo "==> [3/3] Khởi động máy chủ KBack Next.js..."
exec "$@"
