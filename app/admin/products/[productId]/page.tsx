import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VideoGenerator } from "@/components/admin/video-generator";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      shop: true,
      videos: { orderBy: { createdAt: "desc" }, include: { clips: { orderBy: { sequence: "asc" } } } },
    },
  });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.shop.logoEmoji} {product.shop.name}
        </p>
      </div>
      <VideoGenerator product={product} initialVideos={product.videos} />
    </div>
  );
}
