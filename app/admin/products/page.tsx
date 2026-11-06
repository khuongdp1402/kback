import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/admin/product-manager";

export default async function AdminProductsPage() {
  const [products, shops] = await Promise.all([
    prisma.product.findMany({
      include: {
        shop: true,
        createdBy: true,
        videos: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shop.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sản phẩm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý sản phẩm để tạo video AI và link affiliate cho kênh TikTok.
        </p>
      </div>
      <ProductManager initialProducts={products} shops={shops} />
    </div>
  );
}
