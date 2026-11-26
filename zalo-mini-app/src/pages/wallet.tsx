import { useCallback, useEffect, useState } from "react";
import { Box, Button, Input, Page, Select, Spinner, Text, useSnackbar } from "zmp-ui";
import { api, ApiError, formatVnd, type MeResponse } from "../lib/api";

const BANKS = ["Vietcombank", "Techcombank", "BIDV", "VietinBank", "MB Bank", "ACB", "VPBank", "Sacombank", "TPBank", "Agribank"];

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: "kb-badge kb-badge-success",
  PAID: "kb-badge kb-badge-success",
  PENDING: "kb-badge kb-badge-warning",
  APPROVED: "kb-badge kb-badge-warning",
  REJECTED: "kb-badge kb-badge-danger",
  EXPIRED: "kb-badge kb-badge-danger",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function WalletPage() {
  const { openSnackbar } = useSnackbar();
  const [data, setData] = useState<MeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPayout, setShowPayout] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoadError(null);
    api
      .me()
      .then(setData)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  useEffect(load, [load]);

  async function handlePayout() {
    if (!data) return;
    const numeric = Number(amount.replace(/\D/g, ""));
    if (!numeric || numeric < data.minPayoutAmount) {
      openSnackbar({ text: `Số tiền rút tối thiểu là ${formatVnd(data.minPayoutAmount)}`, type: "warning" });
      return;
    }
    if (numeric > data.wallet.availableBalance) {
      openSnackbar({ text: "Số tiền vượt quá số dư khả dụng", type: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await api.payout({
        amount: numeric,
        bankName,
        bankAccountNumber: accountNumber.trim(),
        bankAccountName: accountName.trim(),
      });
      openSnackbar({ text: "Đã gửi yêu cầu rút tiền", type: "success" });
      setShowPayout(false);
      setAmount("");
      load();
    } catch (err) {
      openSnackbar({ text: err instanceof ApiError ? err.message : "Không gửi được yêu cầu", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <Page className="kb-page">
        <Box className="kb-card">
          <Text>{loadError}</Text>
          <Button className="kb-mt8" onClick={load}>
            Thử lại
          </Button>
        </Box>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page className="kb-page kb-center">
        <Spinner />
      </Page>
    );
  }

  const { wallet, membership } = data;

  return (
    <Page className="kb-page">
      <Box className="kb-wallet">
        <Text size="small" className="kb-wallet-label">
          Số dư khả dụng
        </Text>
        <Text.Title size="xLarge" className="kb-wallet-amount">
          {formatVnd(wallet.availableBalance)}
        </Text.Title>
        <Box flex justifyContent="space-between" className="kb-mt8">
          <Box>
            <Text size="xSmall" className="kb-wallet-label">
              Chờ xác nhận
            </Text>
            <Text bold>{formatVnd(wallet.pendingBalance)}</Text>
          </Box>
          <Box>
            <Text size="xSmall" className="kb-wallet-label">
              Đã rút
            </Text>
            <Text bold>{formatVnd(wallet.paidOut)}</Text>
          </Box>
        </Box>
      </Box>

      <Box className="kb-card">
        <Box flex justifyContent="space-between" alignItems="center">
          <Text.Title size="small">Hạng {membership.label}</Text.Title>
          <span className="kb-badge">{membership.sharePercent}% hoa hồng về bạn</span>
        </Box>
        <Text size="xSmall" className="kb-muted kb-mt8">
          {membership.nextLabel
            ? `Mua thêm ${formatVnd(membership.amountToNextTier)} (đơn đã xác nhận) để lên hạng ${membership.nextLabel}.`
            : "Bạn đang ở hạng cao nhất 🎉"}
        </Text>
      </Box>

      <Box className="kb-card">
        {!showPayout ? (
          <Button fullWidth disabled={wallet.availableBalance < data.minPayoutAmount} onClick={() => setShowPayout(true)}>
            Rút tiền về ngân hàng
          </Button>
        ) : (
          <Box className="kb-form">
            <Input
              label="Số tiền (₫)"
              type="number"
              placeholder={`Tối thiểu ${formatVnd(data.minPayoutAmount)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select
              label="Ngân hàng"
              value={bankName}
              closeOnSelect
              onChange={(v) => typeof v === "string" && setBankName(v)}
            >
              {BANKS.map((b) => (
                <Select.Option key={b} value={b} title={b} />
              ))}
            </Select>
            <Input label="Số tài khoản" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            <Input
              label="Tên chủ tài khoản"
              placeholder="NGUYEN VAN A"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value.toUpperCase())}
            />
            <Box className="kb-actions">
              <Button fullWidth loading={submitting} onClick={() => void handlePayout()}>
                Gửi yêu cầu
              </Button>
              <Button fullWidth variant="tertiary" onClick={() => setShowPayout(false)}>
                Huỷ
              </Button>
            </Box>
          </Box>
        )}
        {wallet.availableBalance < data.minPayoutAmount && !showPayout && (
          <Text size="xSmall" className="kb-muted kb-mt8">
            Cần tối thiểu {formatVnd(data.minPayoutAmount)} số dư khả dụng để rút.
          </Text>
        )}
      </Box>

      <Box className="kb-card">
        <Text.Title size="small">Đơn hàng hoàn tiền</Text.Title>
        {data.transactions.length === 0 ? (
          <Text size="small" className="kb-muted kb-mt8">
            Chưa có đơn nào. Dán link ở trang chủ để bắt đầu nhận hoàn tiền!
          </Text>
        ) : (
          data.transactions.map((tx) => (
            <Box key={tx.id} flex justifyContent="space-between" alignItems="center" className="kb-list-row">
              <Box flex alignItems="center" className="kb-row-gap">
                <span className="kb-emoji">{tx.shopEmoji}</span>
                <Box>
                  <Text size="small" bold>
                    {tx.shopName}
                  </Text>
                  <Text size="xxSmall" className="kb-muted">
                    {formatDate(tx.createdAt)} · đơn {formatVnd(tx.orderAmount)}
                  </Text>
                </Box>
              </Box>
              <Box className="kb-right">
                <Text size="small" bold>
                  +{formatVnd(tx.cashbackAmount)}
                </Text>
                <span className={STATUS_CLASS[tx.status] ?? "kb-badge"}>{tx.statusLabel}</span>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {data.payouts.length > 0 && (
        <Box className="kb-card">
          <Text.Title size="small">Lịch sử rút tiền</Text.Title>
          {data.payouts.map((p) => (
            <Box key={p.id} flex justifyContent="space-between" alignItems="center" className="kb-list-row">
              <Box>
                <Text size="small" bold>
                  {formatVnd(p.amount)}
                </Text>
                <Text size="xxSmall" className="kb-muted">
                  {formatDate(p.createdAt)} · {p.bankName}
                </Text>
              </Box>
              <span className={STATUS_CLASS[p.status] ?? "kb-badge"}>{p.statusLabel}</span>
            </Box>
          ))}
        </Box>
      )}
    </Page>
  );
}
