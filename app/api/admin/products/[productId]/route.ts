import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { createProductAffiliateLink } from "@/lib/create-product-affiliate-link";

const updateSchema = z.object({
  shopId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageSource: z.enum(["UPLOADED", "AI_GENERATED"]).optional(),
  sourceUrl: z.string().url().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { productId } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  let product = await prisma.product.update({ where: { id: productId }, data: parsed.data });

  // Re-derive the deep link (new Click) if the source URL or shop changed, since the tracked
  // destination is derived data — see lib/create-product-affiliate-link.ts for why this keeps
  // the old Click around instead of overwriting it.
  if (parsed.data.sourceUrl || parsed.data.shopId) {
    const linkResult = await createProductAffiliateLink(productId, session.user.id);
    if (linkResult.ok) {
      product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    }
  }

  return NextResponse.json({ product });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { productId } = await params;
  await prisma.product.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}
