"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Shop {
  id: string;
  name: string;
  logoEmoji: string;
}

interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  imageUrl: string;
  imageSource: string;
  sourceUrl: string;
  affiliateDeepLink: string | null;
  createdBy: { name: string } | null;
  shop: Shop;
  videos: { id: string; status: string }[];
}

const emptyForm = {
  shopId: "",
  name: "",
  description: "",
  imageUrl: "",
  imageSource: "UPLOADED" as "UPLOADED" | "AI_GENERATED",
  sourceUrl: "",
};

export function ProductManager({
  initialProducts,
  shops,
}: {
  initialProducts: Product[];
  shops: Shop[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState({ ...emptyForm, shopId: shops[0]?.id ?? "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiAngle, setAiAngle] = useState<"front" | "side" | "back" | "closeup">("front");
  const [generatingImage, setGeneratingImage] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, shopId: shops[0]?.id ?? "" });
    setAiDescription("");
    setError(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      shopId: product.shopId,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      imageSource: product.imageSource as "UPLOADED" | "AI_GENERATED",
      sourceUrl: product.sourceUrl,
    });
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/products/upload-image", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload ảnh thất bại");
      return;
    }
    setForm((f) => ({ ...f, imageUrl: data.url, imageSource: "UPLOADED" }));
  }

  async function handleGenerateImage() {
    if (!form.imageUrl) {
      setError(
        "Cần upload ảnh sản phẩm gốc trước — AI chỉnh sửa ảnh có sẵn (ví dụ mặc trang phục lên người mẫu), không tự vẽ ảnh mới từ mô tả suông",
      );
      return;
    }
    if (!aiDescription.trim()) {
      setError("Nhập mô tả trang phục trước khi tạo ảnh AI");
      return;
    }
    setGeneratingImage(true);
    setError(null);
    const res = await fetch("/api/admin/products/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: aiDescription,
        referenceImageUrl: form.imageUrl,
        angle: aiAngle,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setGeneratingImage(false);
    if (!res.ok) {
      setError(data.error ?? "Tạo ảnh AI thất bại");
      return;
    }
    setForm((f) => ({ ...f, imageUrl: data.url, imageSource: "AI_GENERATED" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.imageUrl) {
      setError("Cần có ảnh sản phẩm (upload hoặc tạo bằng AI) trước khi lưu");
      return;
    }

    setLoading(true);
    const res = editingId
      ? await fetch(`/api/admin/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Có lỗi xảy ra");
      return;
    }

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...data.product } : p)),
      );
    } else {
      setProducts((prev) => [
        {
          ...data.product,
          shop: shops.find((s) => s.id === data.product.shopId)!,
          createdBy: null,
          videos: [],
        },
        ...prev,
      ]);
    }
    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá sản phẩm này? Video đã tạo cũng sẽ bị xoá.")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Shop</label>
            <select
              required
              value={form.shopId}
              onChange={(e) => setForm({ ...form, shopId: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.logoEmoji} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tên sản phẩm</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              placeholder="Áo sơ mi lụa hoa nhí"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              URL sản phẩm gốc
            </label>
            <input
              required
              type="url"
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              placeholder="https://shopee.vn/..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              rows={2}
            />
          </div>

          <div className="sm:col-span-2 space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">Ảnh sản phẩm</p>
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="preview"
                className="h-40 w-32 rounded-lg object-cover"
              />
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-foreground">
                  1. Upload ảnh sản phẩm gốc (bắt buộc)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                  className="text-sm text-muted-foreground"
                />
              </label>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-sm font-medium text-foreground">
                2. Tuỳ chọn — dùng AI chỉnh ảnh trên thành người mẫu mặc trang phục
              </p>
              <p className="text-xs text-muted-foreground">
                AI chỉnh sửa dựa trên ảnh đã upload ở bước 1, không tự vẽ ảnh mới từ mô tả suông.
              </p>
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Mô tả trang phục: áo sơ mi lụa họa tiết hoa nhí, tay dài, cổ V..."
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
                rows={2}
              />
              <div className="flex items-center gap-3">
                <select
                  value={aiAngle}
                  onChange={(e) => setAiAngle(e.target.value as typeof aiAngle)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                >
                  <option value="front">Góc trước</option>
                  <option value="side">Góc nghiêng</option>
                  <option value="back">Góc sau</option>
                  <option value="closeup">Cận cảnh chất liệu</option>
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={generatingImage || !form.imageUrl}
                  onClick={handleGenerateImage}
                >
                  {generatingImage ? "Đang tạo ảnh..." : "Tạo ảnh AI"}
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Huỷ
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="divide-y divide-border overflow-hidden">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-14 w-14 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {product.name}{" "}
                  <span className="text-muted-foreground">
                    ({product.shop.logoEmoji} {product.shop.name})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.videos.length > 0
                    ? `${product.videos.length} video`
                    : "Chưa có video"}
                  {product.createdBy && ` · Tạo bởi ${product.createdBy.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={product.affiliateDeepLink ? "success" : "warning"}>
                {product.affiliateDeepLink ? "Có link affiliate" : "Chưa có link"}
              </Badge>
              <Link
                href={`/admin/products/${product.id}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                Tạo video
              </Link>
              <button
                onClick={() => startEdit(product)}
                className="text-sm font-medium text-brand hover:underline"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Xoá
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
