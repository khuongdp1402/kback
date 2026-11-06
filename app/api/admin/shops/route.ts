import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const shopSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  logoEmoji: z.string().min(1),
  network: z.enum(["SHOPEE", "LAZADA", "TIKI", "TIKTOK", "SHOPEEFOOD"]),
  cashbackRate: z.number().min(0).max(100),
  baseUrl: z.string().url(),
  description: z.string().default(""),
  accessTradeCampaignId: z.string().nullable().optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const shops = await prisma.shop.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ shops });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const parsed = shopSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const existing = await prisma.shop.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug này đã tồn tại" }, { status: 409 });
  }

  const shop = await prisma.shop.create({ data: parsed.data });
  return NextResponse.json({ shop }, { status: 201 });
}
