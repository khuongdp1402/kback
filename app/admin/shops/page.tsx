import { prisma } from "@/lib/prisma";
import { ShopManager } from "@/components/admin/shop-manager";

export default async function AdminShopsPage() {
  const shops = await prisma.shop.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shop đối tác</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thêm, sửa, xoá shop và điều chỉnh % hoàn tiền từng sàn.
        </p>
      </div>
      <ShopManager initialShops={shops} />
    </div>
  );
}
