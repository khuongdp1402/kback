#!/bin/sh
set -e

echo "==> [1/3] Đang kiểm tra và đồng bộ Prisma Database Schema..."
npx prisma db push --accept-data-loss

echo "==> [2/3] Đang nạp dữ liệu mặc định (Seed Shops: Shopee, Lazada, Tiki, TikTok Shop, ShopeeFood)..."
npx tsx prisma/seed.ts || echo "Seed skipped or already populated."

echo "==> [3/3] Khởi động máy chủ KBack Next.js..."
exec "$@"
