"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Shop {
  id: string;
  slug: string;
  name: string;
  logoEmoji: string;
  network: string;
  cashbackRate: number;
  baseUrl: string;
  description: string;
  accessTradeCampaignId: string | null;
}

const networks = ["SHOPEE", "LAZADA", "TIKI", "TIKTOK", "SHOPEEFOOD"];

const emptyForm = {
  slug: "",
  name: "",
  logoEmoji: "🛍️",
  network: "SHOPEE",
  cashbackRate: "5",
  baseUrl: "",
  description: "",
  accessTradeCampaignId: "",
};

export function ShopManager({ initialShops }: { initialShops: Shop[] }) {
  const router = useRouter();
  const [shops, setShops] = useState(initialShops);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startEdit(shop: Shop) {
    setEditingId(shop.id);
    setForm({
      slug: shop.slug,
      name: shop.name,
      logoEmoji: shop.logoEmoji,
      network: shop.network,
      cashbackRate: String(shop.cashbackRate),
      baseUrl: shop.baseUrl,
      description: shop.description,
      accessTradeCampaignId: shop.accessTradeCampaignId ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      ...form,
      cashbackRate: Number(form.cashbackRate),
      accessTradeCampaignId: form.accessTradeCampaignId || null,
    };

    const res = editingId
      ? await fetch(`/api/admin/shops/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/shops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Có lỗi xảy ra");
      return;
    }

    if (editingId) {
      setShops((prev) => prev.map((s) => (s.id === editingId ? data.shop : s)));
    } else {
      setShops((prev) => [data.shop, ...prev]);
    }
    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá shop này? Hành động không thể hoàn tác.")) return;
    const res = await fetch(`/api/admin/shops/${id}`, { method: "DELETE" });
    if (res.ok) {
      setShops((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {editingId ? "Sửa shop" : "Thêm shop mới"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
            <input
              required
              disabled={!!editingId}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground disabled:opacity-60"
              placeholder="shopee"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tên shop</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              placeholder="Shopee"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Emoji logo</label>
            <input
              required
              value={form.logoEmoji}
              onChange={(e) => setForm({ ...form, logoEmoji: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Sàn</label>
            <select
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            >
              {networks.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              % hoàn tiền
            </label>
            <input
              required
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={form.cashbackRate}
              onChange={(e) => setForm({ ...form, cashbackRate: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              URL trang chủ sàn
            </label>
            <input
              required
              type="url"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              placeholder="https://shopee.vn"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              AccessTrade Campaign ID
              <span className="ml-1 font-normal text-muted-foreground">
                (bắt buộc để tạo link affiliate thật cho shop này)
              </span>
            </label>
            <input
              value={form.accessTradeCampaignId}
              onChange={(e) => setForm({ ...form, accessTradeCampaignId: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
              placeholder="Ví dụ: 4348614231480407268 — lấy từ URL trang chiến dịch trên AccessTrade"
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
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm shop"}
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
        {shops.map((shop) => (
          <div key={shop.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{shop.logoEmoji}</span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {shop.name} <span className="text-muted-foreground">({shop.slug})</span>
                </p>
                <p className="text-xs text-muted-foreground">{shop.baseUrl}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={shop.accessTradeCampaignId ? "success" : "warning"}>
                {shop.accessTradeCampaignId ? "Đã kết nối AT" : "Chưa có Campaign ID"}
              </Badge>
              <Badge tone="success">{shop.cashbackRate}%</Badge>
              <button
                onClick={() => startEdit(shop)}
                className="text-sm font-medium text-brand hover:underline"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(shop.id)}
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
