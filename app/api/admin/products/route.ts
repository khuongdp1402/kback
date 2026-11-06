import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createProductAffiliateLink } from "@/lib/create-product-affiliate-link";

const productSchema = z.object({
  shopId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  imageUrl: z.string().url(),
  imageSource: z.enum(["UPLOADED", "AI_GENERATED"]).default("UPLOADED"),
  sourceUrl: z.string().url(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const products = await prisma.product.findMany({
    include: { shop: true, createdBy: true, videos: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const shop = await prisma.shop.findUnique({ where: { id: parsed.data.shopId } });
  if (!shop) {
    return NextResponse.json({ error: "Shop không tồn tại" }, { status: 404 });
  }

  const product = await prisma.product.create({ data: parsed.data });

  // Creates a real Click (attributed to this admin) so the link gets AccessTrade tracking —
  // see lib/create-product-affiliate-link.ts. Product is still created even if this fails.
  const linkResult = await createProductAffiliateLink(product.id, session.user.id);
  if (!linkResult.ok) {
    return NextResponse.json({ product }, { status: 201 });
  }

  return NextResponse.json(
    { product: { ...product, affiliateDeepLink: linkResult.trackedUrl } },
    { status: 201 },
  );
}
