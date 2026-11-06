"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const banks = [
  "Vietcombank",
  "Techcombank",
  "BIDV",
  "VietinBank",
  "MB Bank",
  "ACB",
  "VPBank",
  "Sacombank",
  "Momo (ví điện tử)",
];

export function PayoutForm({ availableBalance }: { availableBalance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(banks[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (numericAmount > availableBalance) {
      setError("Số tiền vượt quá số dư khả dụng");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: numericAmount,
        bankName,
        bankAccountNumber,
        bankAccountName,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Không thể tạo yêu cầu rút tiền");
      return;
    }

    setSuccess(true);
    setAmount("");
    setBankAccountNumber("");
    setBankAccountName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-foreground">
          Số tiền muốn rút (VND)
        </label>
        <input
          id="amount"
          type="number"
          min={1}
          max={availableBalance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="Ví dụ: 100000"
          required
        />
      </div>
      <div>
        <label htmlFor="bankName" className="mb-1.5 block text-sm font-medium text-foreground">
          Ngân hàng / ví điện tử
        </label>
        <select
          id="bankName"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {banks.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="accNumber" className="mb-1.5 block text-sm font-medium text-foreground">
          Số tài khoản
        </label>
        <input
          id="accNumber"
          type="text"
          required
          value={bankAccountNumber}
          onChange={(e) => setBankAccountNumber(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div>
        <label htmlFor="accName" className="mb-1.5 block text-sm font-medium text-foreground">
          Tên chủ tài khoản
        </label>
        <input
          id="accName"
          type="text"
          required
          value={bankAccountName}
          onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="NGUYEN VAN A"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-brand-dark">
          Yêu cầu rút tiền đã được tạo và đang xử lý.
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Đang gửi yêu cầu..." : "Yêu cầu rút tiền"}
      </Button>
    </form>
  );
}
