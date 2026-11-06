import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const shops = [
  {
    slug: "shopee",
    name: "Shopee",
    logoEmoji: "🛒",
    network: "SHOPEE" as const,
    cashbackRate: 4.5,
    baseUrl: "https://shopee.vn",
    description: "Hoàn tiền cho mọi đơn hàng trên Shopee, từ thời trang đến điện tử.",
  },
  {
    slug: "lazada",
    name: "Lazada",
    logoEmoji: "🛍️",
    network: "LAZADA" as const,
    cashbackRate: 3.8,
    baseUrl: "https://lazada.vn",
    description: "Săn sale Lazada mỗi ngày, nhận thêm hoàn tiền tự động.",
  },
  {
    slug: "tiki",
    name: "Tiki",
    logoEmoji: "📚",
    network: "TIKI" as const,
    cashbackRate: 3.2,
    baseUrl: "https://tiki.vn",
    description: "Mua sách, đồ gia dụng, công nghệ trên Tiki và nhận hoàn tiền.",
  },
  {
    slug: "tiktok-shop",
    name: "TikTok Shop",
    logoEmoji: "🎵",
    network: "TIKTOK" as const,
    cashbackRate: 5.0,
    baseUrl: "https://shop.tiktok.com",
    description: "Mua sắm qua TikTok Shop, nhận hoàn tiền cho các đơn livestream.",
  },
  {
    slug: "shopeefood",
    name: "ShopeeFood",
    logoEmoji: "🍜",
    network: "SHOPEEFOOD" as const,
    cashbackRate: 6.0,
    baseUrl: "https://shopeefood.vn",
    description: "Đặt đồ ăn qua ShopeeFood, nhận hoàn tiền cho mỗi đơn giao đồ ăn.",
  },
];

async function main() {
  for (const shop of shops) {
    await prisma.shop.upsert({
      where: { slug: shop.slug },
      update: shop,
      create: shop,
    });
  }

  const demoEmail = "demo@cashback.app";
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        name: "Người dùng Demo",
      },
    });
    console.log(`Created demo user: ${demoEmail} / demo1234`);
  }

  const adminEmail = "admin@kback.app";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin1234", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Quản trị viên",
        role: "ADMIN",
      },
    });
    console.log(`Created admin user: ${adminEmail} / admin1234`);
  }

  console.log(`Seeded ${shops.length} shops.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
